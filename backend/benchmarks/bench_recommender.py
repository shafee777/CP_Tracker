#!/usr/bin/env python3
"""
CPAI Recommender Benchmark
==========================
Measures: artifact load time, per-user recommendation latency,
result integrity (no dupes, no solved problems), weak-tag coverage,
difficulty distribution.

All results are real — no mocked timings.
Run from: backend/ directory
Usage:  python benchmarks/bench_recommender.py
"""

import sys, os, json, time, csv, statistics, collections, datetime

# ── resolve paths ──────────────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
OUT_DIR  = os.path.join(ROOT, 'benchmarks', 'results')
os.makedirs(OUT_DIR, exist_ok=True)

# ── imports (fail fast with clear message) ─────────────────────────────────────
try:
    import numpy as np
    import joblib
    from scipy import sparse
    from pymongo import MongoClient
except ImportError as e:
    sys.exit(f"[BLOCKER] Missing dependency: {e}\nRun: pip install numpy scipy joblib pymongo scikit-learn")

# ── ① Load Artifacts (timed) ──────────────────────────────────────────────────
print("=== CPAI Recommender Benchmark ===")
print(f"Timestamp: {datetime.datetime.now().isoformat()}")

t0 = time.perf_counter()
vec_path  = os.path.join(DATA_DIR, 'vectorizer.pkl')
mat_path  = os.path.join(DATA_DIR, 'problems_matrix.npz')
meta_path = os.path.join(DATA_DIR, 'problems_meta.json')
tag_path  = os.path.join(DATA_DIR, 'tag_stats.json')
algo_path = os.path.join(DATA_DIR, 'tag_to_algorithms.json')

for p in [vec_path, mat_path, meta_path, tag_path]:
    if not os.path.exists(p):
        sys.exit(f"[BLOCKER] Artifact missing: {p}\nRun: python scripts/precompute_vectors.py")

vectorizer = joblib.load(vec_path)
matrix     = sparse.load_npz(mat_path)
with open(meta_path, 'r', encoding='utf-8') as f:
    meta = json.load(f)
with open(tag_path, 'r', encoding='utf-8') as f:
    tag_stats = json.load(f)
tag_algos = {}
if os.path.exists(algo_path):
    with open(algo_path, 'r', encoding='utf-8') as f:
        tag_algos = json.load(f)

artifact_load_ms = (time.perf_counter() - t0) * 1000
print(f"\n[Artifact Load] {artifact_load_ms:.1f} ms")
print(f"  Catalog: {len(meta)} problems | Matrix: {matrix.shape} | Vocab: {len(vectorizer.vocabulary_)}")
print(f"  Tags: {len(tag_stats)} | All popularity=0: {all(p.get('popularity',0)==0 for p in meta)}")

# ── Difficulty distribution in catalog ───────────────────────────────────────
diff_dist = collections.Counter(p.get('difficulty','') for p in meta)
print(f"  Difficulty: {dict(diff_dist)}")

# ── Pre-index slug → idx ──────────────────────────────────────────────────────
slug2idx = {p['titleSlug']: i for i, p in enumerate(meta) if p.get('titleSlug')}

# ── ② Connect to MongoDB, pull real users ─────────────────────────────────────
MONGO_URI = 'mongodb://localhost:27017/'
DB_NAME   = 'leetcode_db'
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    db     = client[DB_NAME]
    db.command('ping')
    print(f"\n[MongoDB] Connected to {MONGO_URI}{DB_NAME}")
except Exception as e:
    sys.exit(f"[BLOCKER] MongoDB unavailable: {e}")

# Collect all users that have solved-problems data
all_users_raw = list(db['auth_datas'].find(
    {},
    {'email':0, 'password':0, 'resetToken':0}
))

profiles = []
for u in all_users_raw:
    lc_username = u.get('leetcodeUsername','')
    pd = u.get('platformDetails',{}) or {}
    lc = pd.get('leetcode',{}) or {}
    sp = lc.get('solvedProblems', {})
    if isinstance(sp, dict):
        solved_slugs = set(sp.keys())
    elif isinstance(sp, list):
        solved_slugs = set(sp)
    else:
        solved_slugs = set()
    lc_all = next((x['count'] for x in lc.get('problemsSolved',[]) if x.get('difficulty')=='All'), 0)
    profiles.append({
        'db_username': u.get('username','?'),
        'lc_username': lc_username or '(none)',
        'solved_count_api': lc_all,
        'solved_slugs_count': len(solved_slugs),
        'solved_slugs': solved_slugs,
    })

print(f"\n[Profiles] Found {len(profiles)} users in DB")
for p in profiles:
    print(f"  {p['db_username']:20s} | LC:{p['lc_username']:20s} | API solved:{p['solved_count_api']:4d} | slug DB:{p['solved_slugs_count']:4d}")

# ── ③ Core recommendation function (mirrors ml.py logic exactly) ──────────────
def recommend_for_profile(solved_slugs: set, top_n: int = 10):
    """Pure-Python reimplementation matching ml.py exactly. Returns timing dict."""
    t_start = time.perf_counter()
    alpha = 1.0

    # Build user vector
    solved_indices = [slug2idx[s] for s in solved_slugs if s in slug2idx]
    if solved_indices:
        sub  = matrix[solved_indices]
        avg  = np.asarray(sub.mean(axis=0)).ravel()
        norm = np.linalg.norm(avg)
        user_vec = avg / norm if norm > 0 else avg
    else:
        user_vec = np.zeros(matrix.shape[1], dtype=float)

    # Tag counts from solved problems
    user_tag_counts = collections.Counter()
    for s in solved_slugs:
        idx = slug2idx.get(s)
        if idx is not None:
            for t in meta[idx].get('tags', []):
                user_tag_counts[t] += 1

    # Proficiency + weak tags
    prof = {}
    for tag, total in tag_stats.items():
        prof[tag] = (user_tag_counts.get(tag, 0) + alpha) / (total + alpha)

    candidates = [(t, p, tag_stats.get(t, 0)) for t, p in prof.items() if tag_stats.get(t, 0) >= 5]
    candidates.sort(key=lambda x: x[1])
    weak_tags = candidates[:5]

    t_vector_ms = (time.perf_counter() - t_start) * 1000

    # Popularity is all 0 — note that and skip normalization
    pop_array = np.array([p.get('popularity', 0) for p in meta], dtype=float)
    pop_max = pop_array.max()
    if pop_max > 0:
        pop_norm = (pop_array - pop_array.min()) / (pop_max - pop_array.min())
    else:
        pop_norm = np.zeros_like(pop_array)

    mat_csr = matrix.tocsr()

    recs_by_tag = {}
    for tag, p_score, total in weak_tags:
        cand_idxs = [
            i for i, pm in enumerate(meta)
            if tag in pm.get('tags', []) and pm.get('titleSlug') not in solved_slugs
        ]
        if not cand_idxs:
            recs_by_tag[tag] = []
            continue

        uv_norm = np.linalg.norm(user_vec)
        if uv_norm > 0:
            sims = np.asarray(mat_csr[cand_idxs].dot(user_vec)).ravel()
        else:
            sims = np.zeros(len(cand_idxs))

        pops = pop_norm[cand_idxs]
        scores = 0.7 * sims + 0.3 * pops
        top_order = np.argsort(scores)[::-1][:top_n]

        recs_by_tag[tag] = [
            {
                'title': meta[cand_idxs[int(ix)]].get('title'),
                'titleSlug': meta[cand_idxs[int(ix)]].get('titleSlug'),
                'tags': meta[cand_idxs[int(ix)]].get('tags', []),
                'difficulty': meta[cand_idxs[int(ix)]].get('difficulty', ''),
                'score': float(scores[int(ix)]),
            }
            for ix in top_order
        ]

    t_total_ms = (time.perf_counter() - t_start) * 1000

    return {
        'weak_tags': [t for t, _, _ in weak_tags],
        'recs_by_tag': recs_by_tag,
        'timing_ms': {
            'vector_build': t_vector_ms,
            'total': t_total_ms,
            'search_only': t_total_ms - t_vector_ms,
        },
        'user_tag_counts': dict(user_tag_counts),
        'proficiency': prof,
    }

# ── ④ Integrity checks ────────────────────────────────────────────────────────
def check_integrity(result, solved_slugs):
    issues = []
    all_recs = []
    for tag, recs in result['recs_by_tag'].items():
        for r in recs:
            all_recs.append((tag, r['titleSlug']))
    # No solved problems in recs
    for tag, slug in all_recs:
        if slug in solved_slugs:
            issues.append(f"SOLVED_IN_RECS: {slug} (tag={tag})")
    # No duplicates within same tag
    for tag, recs in result['recs_by_tag'].items():
        slugs = [r['titleSlug'] for r in recs]
        if len(slugs) != len(set(slugs)):
            issues.append(f"DUPES_IN_TAG: {tag}")
    # All slugs exist in catalog
    catalog_slugs = {p['titleSlug'] for p in meta}
    for tag, slug in all_recs:
        if slug not in catalog_slugs:
            issues.append(f"SLUG_NOT_IN_CATALOG: {slug}")
    return issues

# ── ⑤ Run benchmarks ─────────────────────────────────────────────────────────
N_WARMUP = 3
N_RUNS   = 20   # per profile

print(f"\n[Benchmark] {N_WARMUP} warmup + {N_RUNS} measured runs per profile")

summary_rows = []
all_run_rows = []
quality_rows = []

for profile in profiles:
    slug_set = profile['solved_slugs']
    label    = profile['db_username']

    # warmup
    for _ in range(N_WARMUP):
        recommend_for_profile(slug_set)

    timings = []
    last_result = None
    for run_i in range(N_RUNS):
        res = recommend_for_profile(slug_set)
        timings.append(res['timing_ms']['total'])
        last_result = res
        all_run_rows.append({
            'profile': label,
            'lc_username': profile['lc_username'],
            'solved_slug_count': len(slug_set),
            'run': run_i,
            'total_ms': round(res['timing_ms']['total'], 3),
            'vector_ms': round(res['timing_ms']['vector_build'], 3),
            'search_ms': round(res['timing_ms']['search_only'], 3),
        })

    med   = round(statistics.median(timings), 3)
    p95   = round(sorted(timings)[int(0.95*N_RUNS)-1], 3)
    p_min = round(min(timings), 3)
    p_max = round(max(timings), 3)

    # Integrity
    issues = check_integrity(last_result, slug_set)

    # Quality metrics
    weak_tags  = last_result['weak_tags']
    total_recs = sum(len(v) for v in last_result['recs_by_tag'].values())
    diff_in_recs = collections.Counter(
        r['difficulty']
        for recs in last_result['recs_by_tag'].values()
        for r in recs
    )

    # Weak-tag coverage: fraction of weak tags that have ≥1 recommendation
    covered = sum(1 for t in weak_tags if last_result['recs_by_tag'].get(t))
    coverage = covered / len(weak_tags) if weak_tags else 0.0

    summary_rows.append({
        'profile': label,
        'lc_username': profile['lc_username'],
        'solved_slug_count': len(slug_set),
        'solved_api_count': profile['solved_count_api'],
        'runs': N_RUNS,
        'median_ms': med,
        'p95_ms': p95,
        'min_ms': p_min,
        'max_ms': p_max,
        'weak_tags': '|'.join(weak_tags),
        'weak_tag_coverage': round(coverage, 3),
        'total_recs': total_recs,
        'recs_Easy': diff_in_recs.get('Easy', 0),
        'recs_Medium': diff_in_recs.get('Medium', 0),
        'recs_Hard': diff_in_recs.get('Hard', 0),
        'integrity_issues': len(issues),
        'integrity_detail': ';'.join(issues) if issues else 'OK',
    })

    quality_rows.append({
        'profile': label,
        'solved_slug_count': len(slug_set),
        'weak_tags': '|'.join(weak_tags),
        'weak_tag_coverage': round(coverage, 3),
        'Easy_%': round(100*diff_in_recs.get('Easy',0)/total_recs,1) if total_recs else 0,
        'Medium_%': round(100*diff_in_recs.get('Medium',0)/total_recs,1) if total_recs else 0,
        'Hard_%': round(100*diff_in_recs.get('Hard',0)/total_recs,1) if total_recs else 0,
        'total_recs': total_recs,
        'integrity_issues': len(issues),
    })

    print(f"\n  [{label}] solved_slugs={len(slug_set)} | median={med}ms p95={p95}ms")
    print(f"    weak_tags={weak_tags}")
    print(f"    coverage={coverage:.0%} | recs={total_recs} | issues={len(issues)}")

# ── ⑥ Aggregate stats ─────────────────────────────────────────────────────────
all_medians = [r['median_ms'] for r in summary_rows]
all_p95s    = [r['p95_ms']    for r in summary_rows]
print(f"\n=== AGGREGATE ===")
print(f"  Profiles benchmarked: {len(summary_rows)}")
print(f"  Artifact load: {artifact_load_ms:.1f} ms")
print(f"  Per-user median ms : median={round(statistics.median(all_medians),3)} | p95={round(sorted(all_p95s)[int(0.95*len(all_p95s))-1],3)}")

# ── ⑦ Save CSVs ──────────────────────────────────────────────────────────────
def save_csv(path, rows):
    if not rows: return
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader(); w.writerows(rows)
    print(f"  Saved: {path}")

save_csv(os.path.join(OUT_DIR, 'recommender_summary.csv'), summary_rows)
save_csv(os.path.join(OUT_DIR, 'recommender_all_runs.csv'), all_run_rows)
save_csv(os.path.join(OUT_DIR, 'recommender_quality.csv'), quality_rows)

# ── ⑧ Artifact meta JSON ─────────────────────────────────────────────────────
meta_out = {
    'run_at': datetime.datetime.now().isoformat(),
    'environment': {
        'python': sys.version,
        'node': 'v20.16.0',
        'platform': sys.platform,
        'catalog_size': len(meta),
        'matrix_shape': list(matrix.shape),
        'vocab_size': len(vectorizer.vocabulary_),
        'tag_count': len(tag_stats),
        'all_popularity_zero': all(p.get('popularity',0)==0 for p in meta),
        'difficulty_dist': dict(diff_dist),
    },
    'benchmark': {
        'warmup_runs': N_WARMUP,
        'measured_runs_per_profile': N_RUNS,
        'profiles_tested': len(summary_rows),
        'artifact_load_ms': round(artifact_load_ms, 2),
        'caching': 'none (artifacts loaded once per process)',
        'external_api': 'none (all data from MongoDB + local files)',
    },
    'aggregate': {
        'median_of_medians_ms': round(statistics.median(all_medians), 3),
        'p95_of_p95s_ms': round(sorted(all_p95s)[int(0.95*len(all_p95s))-1] if all_p95s else 0, 3),
    },
    'limitations': [
        'All popularity scores are 0 — popularity dimension of scoring is inactive.',
        'Codeforces / CodeChef profiles not used by recommender (LC-only).',
        'solved_slugs mismatch: some users have API-reported solved count >> slug DB count.',
        'No human-labeled relevance judgments — Precision@10 cannot be computed.',
        'Circularity: weak tags are both ranking inputs AND evaluation targets.',
    ],
}
with open(os.path.join(OUT_DIR, 'recommender_meta.json'), 'w', encoding='utf-8') as f:
    json.dump(meta_out, f, indent=2)
print(f"  Saved: {os.path.join(OUT_DIR, 'recommender_meta.json')}")
print("\n[DONE] Recommender benchmark complete.")
