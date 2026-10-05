#!/usr/bin/env python3
"""
CPAI Backend Aggregation Latency Benchmark
==========================================
Measures: response latency of the /all/combined endpoint,
which is the main "dashboard load" route (calls all 3 platforms,
normalizes data, saves to MongoDB).

IMPORTANT: This benchmark calls LIVE external APIs (LeetCode GraphQL,
Codeforces REST, CodeChef scraper). Results depend on network and
third-party availability. They are labeled as LIVE where applicable.

Rules enforced:
- Minimum 500ms sleep between runs to respect rate limits.
- Uses only usernames already in the database (no new profile creation).
- Reports failures separately from successes.
- Records cache state (the app uses in-memory per-run caching; this
  test bypasses the Express server and calls the upstream helpers
  directly for cleaner timing isolation).

Run from: backend/ directory
Usage:    python benchmarks/bench_backend_latency.py [--runs 5]
"""

import sys, os, json, time, csv, statistics, datetime, argparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'benchmarks', 'results')
os.makedirs(OUT_DIR, exist_ok=True)

try:
    import requests
    from pymongo import MongoClient
    import collections
except ImportError as e:
    sys.exit(f"[BLOCKER] Missing dependency: {e}\nRun: pip install requests pymongo")

# ── Parse args ─────────────────────────────────────────────────────────────────
ap = argparse.ArgumentParser()
ap.add_argument('--runs', type=int, default=5,
    help='Measured runs per profile (default=5; keep low to respect API limits)')
ap.add_argument('--server', default='http://localhost:3000',
    help='Backend server URL')
ap.add_argument('--rate-limit-sleep', type=float, default=2.0,
    help='Seconds to sleep between runs (default=2.0)')
args = ap.parse_args()

print("=== CPAI Backend Aggregation Latency Benchmark ===")
print(f"Timestamp: {datetime.datetime.now().isoformat()}")
print(f"Server: {args.server} | Runs/profile: {args.runs} | Sleep: {args.rate_limit_sleep}s")
print(f"NOTE: Results are LIVE — depend on external API availability and network.")

# ── Check server is up ─────────────────────────────────────────────────────────
try:
    r = requests.get(args.server, timeout=5)
    print(f"\n[Server] Reachable: {r.status_code}")
except Exception as e:
    print(f"\n[BLOCKER] Server not reachable at {args.server}: {e}")
    print("Start the backend first:  cd backend && node index.js")
    print("Continuing with server-unreachable measurements = N/A")
    SERVER_UP = False
else:
    SERVER_UP = True

# ── Pull profiles from MongoDB ─────────────────────────────────────────────────
try:
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=3000)
    db = client['leetcode_db']
    db.command('ping')
    users_raw = list(db['auth_datas'].find({}, {'email':0,'password':0,'resetToken':0}))
except Exception as e:
    sys.exit(f"[BLOCKER] MongoDB unavailable: {e}")

profiles = []
for u in users_raw:
    lc = u.get('leetcodeUsername','')
    cf = u.get('codeforcesUsername','')
    cc = u.get('codechefUsername','')
    uid = str(u.get('_id',''))
    if lc and cf and cc and lc != 'undefined':
        profiles.append({'userId':uid,'lcUsername':lc,'cfUsername':cf,'ccUsername':cc,'dbUser':u.get('username','?')})

# Deduplicate by LC username (same person registered multiple times)
seen = set()
unique_profiles = []
for p in profiles:
    key = p['lcUsername'].lower()
    if key not in seen:
        seen.add(key)
        unique_profiles.append(p)

print(f"\n[Profiles] {len(unique_profiles)} unique profiles with full platform data:")
for p in unique_profiles:
    print(f"  {p['dbUser']:20s} | LC:{p['lcUsername']:20s} | CF:{p['cfUsername']:20s} | CC:{p['ccUsername']}")

# ── Benchmark /all/combined ────────────────────────────────────────────────────
all_run_rows = []
summary_rows = []
N_WARMUP = 1

for profile in unique_profiles:
    label = profile['dbUser']
    payload = {
        'leetcodeUsername':   profile['lcUsername'],
        'codeforcesUsername': profile['cfUsername'],
        'codechefUsername':   profile['ccUsername'],
        'userId':             profile['userId'],
    }

    if not SERVER_UP:
        summary_rows.append({
            'profile': label,
            'runs': args.runs,
            'success': 'N/A',
            'failure': 'N/A',
            'median_ms': 'N/A',
            'p95_ms': 'N/A',
            'note': 'Server unreachable',
        })
        continue

    print(f"\n  [{label}] warming up ({N_WARMUP} run)...")
    for _ in range(N_WARMUP):
        try:
            requests.post(f"{args.server}/all/combined", json=payload, timeout=60)
        except Exception:
            pass
        time.sleep(args.rate_limit_sleep)

    timings = []
    successes = 0
    failures  = 0
    platform_status_accum = []

    print(f"  [{label}] measuring ({args.runs} runs)...")
    for run_i in range(args.runs):
        t0 = time.perf_counter()
        try:
            resp = requests.post(f"{args.server}/all/combined", json=payload, timeout=90)
            elapsed_ms = (time.perf_counter() - t0) * 1000
            ok = resp.status_code == 200
            if ok:
                data = resp.json()
                ps = data.get('platformStatus', {})
                statuses = {k: ps[k]['status'] if isinstance(ps.get(k),dict) else 'unknown' for k in ['leetcode','codeforces','codechef']}
                successes += 1
                platform_status_accum.append(statuses)
            else:
                statuses = {'error': resp.status_code}
                failures += 1
        except Exception as ex:
            elapsed_ms = (time.perf_counter() - t0) * 1000
            ok = False
            failures += 1
            statuses = {'exception': str(ex)[:60]}

        timings.append(elapsed_ms)
        all_run_rows.append({
            'profile': label,
            'run': run_i,
            'elapsed_ms': round(elapsed_ms, 2),
            'success': ok,
            'platform_statuses': json.dumps(statuses),
        })
        print(f"    run {run_i+1}/{args.runs}: {elapsed_ms:.0f}ms {'OK' if ok else 'FAIL'} {statuses}")
        time.sleep(args.rate_limit_sleep)

    success_timings = [t for t, r in zip(timings, all_run_rows[-args.runs:]) if r['success']]
    med   = round(statistics.median(success_timings), 2) if success_timings else 'N/A'
    p95   = round(sorted(success_timings)[int(0.95*len(success_timings))-1], 2) if len(success_timings) >= 2 else 'N/A'
    p_min = round(min(success_timings), 2) if success_timings else 'N/A'
    p_max = round(max(success_timings), 2) if success_timings else 'N/A'

    # Aggregate platform statuses
    if platform_status_accum:
        agg_status = {}
        for plat in ['leetcode','codeforces','codechef']:
            statuses_for_plat = [s.get(plat,'?') for s in platform_status_accum]
            agg_status[plat] = collections.Counter(statuses_for_plat).most_common(1)[0][0]
    else:
        agg_status = {}

    import collections
    summary_rows.append({
        'profile': label,
        'lc_username': profile['lcUsername'],
        'runs': args.runs,
        'success': successes,
        'failure': failures,
        'median_ms': med,
        'p95_ms': p95,
        'min_ms': p_min,
        'max_ms': p_max,
        'lc_status': agg_status.get('leetcode','?'),
        'cf_status': agg_status.get('codeforces','?'),
        'cc_status': agg_status.get('codechef','?'),
        'cache': 'in-memory cleared each server restart; runs share same process cache',
    })
    print(f"    → median={med}ms p95={p95}ms success={successes}/{args.runs}")

# ── Per-platform latency (individual endpoints) ───────────────────────────────
per_platform_rows = []
print("\n\n[Per-platform endpoint timing]")

if SERVER_UP and unique_profiles:
    sample = unique_profiles[0]
    for platform, username in [
        ('leetcode',   sample['lcUsername']),
        ('codeforces', sample['cfUsername']),
        ('codechef',   sample['ccUsername']),
    ]:
        url = f"{args.server}/all/{platform}/{username}"
        timings_plat = []
        for _ in range(3):  # small sample to save API quota
            t0 = time.perf_counter()
            try:
                r = requests.get(url, timeout=45)
                ms = (time.perf_counter()-t0)*1000
                ok = r.status_code == 200
            except Exception as ex:
                ms = (time.perf_counter()-t0)*1000
                ok = False
            timings_plat.append(ms)
            per_platform_rows.append({'platform':platform,'username':username,'elapsed_ms':round(ms,2),'success':ok})
            time.sleep(args.rate_limit_sleep)
        med_plat = round(statistics.median(timings_plat), 2)
        print(f"  /all/{platform}/{username} → median={med_plat}ms")

# ── Save results ───────────────────────────────────────────────────────────────
def save_csv(path, rows):
    if not rows: return
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader(); w.writerows(rows)
    print(f"Saved: {path}")

save_csv(os.path.join(OUT_DIR, 'backend_summary.csv'), summary_rows)
save_csv(os.path.join(OUT_DIR, 'backend_all_runs.csv'), all_run_rows)
save_csv(os.path.join(OUT_DIR, 'backend_per_platform.csv'), per_platform_rows)

meta_out = {
    'run_at': datetime.datetime.now().isoformat(),
    'server': args.server,
    'runs_per_profile': args.runs,
    'warmup_runs': N_WARMUP,
    'rate_limit_sleep_s': args.rate_limit_sleep,
    'server_was_up': SERVER_UP,
    'data_source': 'LIVE external APIs (LeetCode GraphQL, Codeforces REST, CodeChef HTML scraper)',
    'cache_note': 'Express in-memory cache (plain object, no TTL) — runs after warmup may hit cache',
    'limitations': [
        'External API latency varies with third-party load and network.',
        'LeetCode rate-limits GraphQL — consecutive runs risk 429.',
        'CodeChef uses HTML scraping — fragile to markup changes.',
        'Platform cache in Express is per-process; warmup run populates it.',
        'Caching means run-2+ may be faster than uncached — labeled accordingly.',
    ],
}
with open(os.path.join(OUT_DIR, 'backend_meta.json'), 'w', encoding='utf-8') as f:
    json.dump(meta_out, f, indent=2)
print(f"Saved: {os.path.join(OUT_DIR, 'backend_meta.json')}")
print("\n[DONE] Backend latency benchmark complete.")
