#!/usr/bin/env python3
"""
CPAI HTTP Recommendation Benchmark (20 Misses + 20 Hits)
==========================================================
Measures real HTTP round-trip latency against Express /recommend/:username
under strictly comparable conditions:
  Part 1: 20 Cold Cache-Miss requests (cache cleared/bypassed via test header)
  Part 2: 20 Warm Cache-Hit requests (cache hit from memory)

Verifies:
  - Latency: raw runs, median, p95, min, max
  - Failures: count of non-200 or errored responses
  - Output consistency: hash / deep-equality check across all responses
  - Test-limited cache control (X-Test-Bypass-Cache header)

Saves:
  - benchmarks/results/http_recommend_20_runs.csv
  - benchmarks/results/http_recommend_20_runs.json
"""

import sys, os, time, requests, json, statistics, hashlib, csv, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'benchmarks', 'results')
os.makedirs(OUT_DIR, exist_ok=True)

BASE_URL = os.environ.get('CPAI_BASE_URL', 'http://localhost:3000')
TEST_USER = 'Thorfin_7'   # Has 219 stored solved problems in MongoDB
N_RUNS = 20

print("=== CPAI HTTP Recommendation Benchmark (20 Misses vs 20 Hits) ===")
print(f"Timestamp: {datetime.datetime.now().isoformat()}")
print(f"Server: {BASE_URL} | Test Profile: {TEST_USER} | Runs per phase: {N_RUNS}")

# Check server reachability
try:
    ping = requests.get(BASE_URL, timeout=5)
    print(f"[Server] Reachable: status {ping.status_code}")
except Exception as e:
    sys.exit(f"[BLOCKER] Server unreachable at {BASE_URL}: {e}")

# ── Phase 1: 20 Cache-Miss Requests ───────────────────────────────────────────
print(f"\n[Phase 1] Executing {N_RUNS} Cache-Miss requests...")
miss_timings = []
miss_hashes = []
miss_failures = 0
miss_rows = []

for i in range(1, N_RUNS + 1):
    t0 = time.perf_counter()
    try:
        # Use test-environment bypass header so every request forces fresh Python execution
        resp = requests.get(
            f"{BASE_URL}/recommend/{TEST_USER}",
            headers={'X-Test-Bypass-Cache': 'true'},
            timeout=30
        )
        elapsed_ms = (time.perf_counter() - t0) * 1000
        if resp.status_code == 200:
            data = resp.json()
            # Calculate content hash (excluding variable timestamps if any)
            canonical = json.dumps({
                'user': data.get('username'),
                'weak': data.get('weak_tags'),
                'recs': [r['titleSlug'] for r in data.get('recommended', [])]
            }, sort_keys=True)
            h = hashlib.sha256(canonical.encode('utf-8')).hexdigest()[:12]
            miss_hashes.append(h)
            miss_timings.append(elapsed_ms)
            cache_hdr = resp.headers.get('X-Cache', 'NONE')
            miss_rows.append({
                'phase': 'cache_miss',
                'run': i,
                'elapsed_ms': round(elapsed_ms, 2),
                'status': resp.status_code,
                'x_cache': cache_hdr,
                'recs_count': len(data.get('recommended', [])),
                'content_hash': h
            })
            print(f"  Miss {i:02d}/{N_RUNS}: {elapsed_ms:7.1f} ms | Status: {resp.status_code} | X-Cache: {cache_hdr} | hash: {h}")
        else:
            miss_failures += 1
            print(f"  Miss {i:02d}/{N_RUNS}: FAILED (HTTP {resp.status_code})")
    except Exception as ex:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        miss_failures += 1
        print(f"  Miss {i:02d}/{N_RUNS}: EXCEPTION ({ex})")

# ── Prime the cache for Phase 2 ────────────────────────────────────────────────
print("\n[Setup] Priming cache for warm cache-hit phase...")
prime_resp = requests.get(f"{BASE_URL}/recommend/{TEST_USER}", timeout=30)
assert prime_resp.status_code == 200, "Cache priming must succeed"

# ── Phase 2: 20 Cache-Hit Requests ────────────────────────────────────────────
print(f"\n[Phase 2] Executing {N_RUNS} Warm Cache-Hit requests...")
hit_timings = []
hit_hashes = []
hit_failures = 0
hit_rows = []

for i in range(1, N_RUNS + 1):
    t0 = time.perf_counter()
    try:
        resp = requests.get(f"{BASE_URL}/recommend/{TEST_USER}", timeout=5)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        if resp.status_code == 200:
            data = resp.json()
            canonical = json.dumps({
                'user': data.get('username'),
                'weak': data.get('weak_tags'),
                'recs': [r['titleSlug'] for r in data.get('recommended', [])]
            }, sort_keys=True)
            h = hashlib.sha256(canonical.encode('utf-8')).hexdigest()[:12]
            hit_hashes.append(h)
            hit_timings.append(elapsed_ms)
            cache_hdr = resp.headers.get('X-Cache', 'NONE')
            hit_rows.append({
                'phase': 'cache_hit',
                'run': i,
                'elapsed_ms': round(elapsed_ms, 2),
                'status': resp.status_code,
                'x_cache': cache_hdr,
                'recs_count': len(data.get('recommended', [])),
                'content_hash': h
            })
            print(f"  Hit  {i:02d}/{N_RUNS}: {elapsed_ms:7.2f} ms | Status: {resp.status_code} | X-Cache: {cache_hdr} | hash: {h}")
        else:
            hit_failures += 1
            print(f"  Hit  {i:02d}/{N_RUNS}: FAILED (HTTP {resp.status_code})")
    except Exception as ex:
        hit_failures += 1
        print(f"  Hit  {i:02d}/{N_RUNS}: EXCEPTION ({ex})")

# ── Statistical Calculations ───────────────────────────────────────────────────
def stats(timings):
    if not timings: return {'median': None, 'p95': None, 'min': None, 'max': None, 'mean': None}
    s = sorted(timings)
    n = len(s)
    p95_idx = max(0, int(0.95 * n) - 1)
    return {
        'median': round(statistics.median(timings), 2),
        'p95': round(s[p95_idx], 2),
        'min': round(min(timings), 2),
        'max': round(max(timings), 2),
        'mean': round(statistics.mean(timings), 2),
    }

miss_stats = stats(miss_timings)
hit_stats = stats(hit_timings)

# Output consistency check
unique_miss_hashes = set(miss_hashes)
unique_hit_hashes = set(hit_hashes)
consistent = (len(unique_miss_hashes) == 1 and len(unique_hit_hashes) == 1 and unique_miss_hashes == unique_hit_hashes)

speedup = round(miss_stats['median'] / hit_stats['median'], 1) if hit_stats['median'] else None
latency_reduction_pct = round(((miss_stats['median'] - hit_stats['median']) / miss_stats['median']) * 100, 2) if miss_stats['median'] and hit_stats['median'] else None

print("\n" + "=" * 60)
print("BENCHMARK SUMMARY (20 Misses vs 20 Hits)")
print("=" * 60)
print(f"Cache-Miss (Fresh Execution via Python spawn):")
print(f"  Runs:      {len(miss_timings)} success, {miss_failures} fail")
print(f"  Median:    {miss_stats['median']} ms")
print(f"  p95:       {miss_stats['p95']} ms")
print(f"  Min / Max: {miss_stats['min']} ms / {miss_stats['max']} ms")
print(f"\nWarm Cache-Hit (In-Memory NodeCache):")
print(f"  Runs:      {len(hit_timings)} success, {hit_failures} fail")
print(f"  Median:    {hit_stats['median']} ms")
print(f"  p95:       {hit_stats['p95']} ms")
print(f"  Min / Max: {hit_stats['min']} ms / {hit_stats['max']} ms")
print(f"\nComparison:")
print(f"  Speedup:             {speedup}x")
print(f"  Latency Reduction:   {latency_reduction_pct}%")
print(f"  Output Consistency:  {'100% MATCH (0 drift across all 40 runs)' if consistent else 'INCONSISTENT'}")
print("=" * 60)

# ── Save CSV & JSON ────────────────────────────────────────────────────────────
csv_path = os.path.join(OUT_DIR, 'http_recommend_20_runs.csv')
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['phase', 'run', 'elapsed_ms', 'status', 'x_cache', 'recs_count', 'content_hash'])
    writer.writeheader()
    writer.writerows(miss_rows + hit_rows)
print(f"Saved: {csv_path}")

json_path = os.path.join(OUT_DIR, 'http_recommend_20_runs.json')
summary_data = {
    'benchmark': 'HTTP /recommend/:username 20 Misses vs 20 Hits',
    'timestamp': datetime.datetime.now().isoformat(),
    'environment': {
        'server': BASE_URL,
        'profile': TEST_USER,
        'runs_per_phase': N_RUNS,
        'node_cache_ttl_seconds': 300,
        'cache_type': 'Fixed TTL in-memory NodeCache',
    },
    'cache_miss': {
        'total_runs': N_RUNS,
        'successes': len(miss_timings),
        'failures': miss_failures,
        'stats_ms': miss_stats,
        'raw_timings_ms': miss_timings,
    },
    'cache_hit': {
        'total_runs': N_RUNS,
        'successes': len(hit_timings),
        'failures': hit_failures,
        'stats_ms': hit_stats,
        'raw_timings_ms': hit_timings,
    },
    'comparison': {
        'speedup_ratio': speedup,
        'latency_reduction_pct': latency_reduction_pct,
        'output_consistency_verified': consistent,
        'content_hash': list(unique_hit_hashes)[0] if unique_hit_hashes else None,
    }
}
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(summary_data, f, indent=2)
print(f"Saved: {json_path}")
