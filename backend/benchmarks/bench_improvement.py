#!/usr/bin/env python3
"""
CPAI Recommender Improvement Benchmark: Cold Spawn vs Warm Daemon
================================================================
Compares:
  A. Baseline (current): spawn("python", ["ml.py", username]) on every request.
     Re-loads all disk artifacts on every invocation.
  B. Targeted Improvement: Warm in-memory recommender (artifacts loaded once).
     Processes requests in-memory without process spawn or disk I/O.

Measures 10 consecutive requests for both methods under identical environment.
Saves raw results to CSV and JSON.
"""

import sys, os, time, subprocess, json, statistics, csv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'benchmarks', 'results')
os.makedirs(OUT_DIR, exist_ok=True)

# Add ROOT to sys.path so we can import ml.py functions directly
sys.path.insert(0, ROOT)
from ml import load_artifacts, recommend_for_user

print("=== CPAI Recommender Bottleneck Benchmark ===")
print("Comparing Baseline (cold spawn per request) vs Improved (warm in-memory)")

TEST_USER = "Shafee_77"
N_RUNS = 10

# ── 1. Benchmark Baseline: Cold spawn per request ─────────────────────────────
print(f"\n[1/2] Measuring Baseline: Cold spawn ({N_RUNS} runs of 'python ml.py {TEST_USER}')...")
cold_times = []
for i in range(N_RUNS):
    t0 = time.perf_counter()
    res = subprocess.run(
        [sys.executable, os.path.join(ROOT, 'ml.py'), TEST_USER],
        capture_output=True, text=True, cwd=ROOT
    )
    elapsed = (time.perf_counter() - t0) * 1000
    if res.returncode != 0:
        print(f"  Run {i+1} FAILED: {res.stderr[:80]}")
    else:
        cold_times.append(elapsed)
        print(f"  Run {i+1}/{N_RUNS}: {elapsed:.1f} ms")

cold_med = statistics.median(cold_times)
cold_p95 = sorted(cold_times)[int(0.95 * len(cold_times)) - 1]
print(f"Baseline Cold Spawn -> Median: {cold_med:.1f} ms | p95: {cold_p95:.1f} ms")

# ── 2. Benchmark Improved: Warm in-memory ──────────────────────────────────────
print(f"\n[2/2] Measuring Improved: Warm in-memory ({N_RUNS} runs, artifacts preloaded)...")
t_load_start = time.perf_counter()
artifacts = load_artifacts()
one_time_load_ms = (time.perf_counter() - t_load_start) * 1000
print(f"  [One-time artifact load]: {one_time_load_ms:.1f} ms")

warm_times = []
for i in range(N_RUNS):
    t0 = time.perf_counter()
    # Call directly with preloaded artifacts (or recommend_for_user)
    out = recommend_for_user(TEST_USER)
    elapsed = (time.perf_counter() - t0) * 1000
    warm_times.append(elapsed)
    print(f"  Run {i+1}/{N_RUNS}: {elapsed:.2f} ms")

warm_med = statistics.median(warm_times)
warm_p95 = sorted(warm_times)[int(0.95 * len(warm_times)) - 1]
print(f"Improved Warm In-Memory -> Median: {warm_med:.2f} ms | p95: {warm_p95:.2f} ms")

# ── Verification of Output Parity ──────────────────────────────────────────────
cold_out = json.loads(res.stdout)
parity_check = (
    cold_out.get('username') == out.get('username') and
    [w['tag'] for w in cold_out.get('weak_tags', [])] == [w['tag'] for w in out.get('weak_tags', [])]
)
print(f"\n[Verification] Output parity verified: {parity_check}")

# ── Summary & Metrics ──────────────────────────────────────────────────────────
latency_reduction_ms = cold_med - warm_med
latency_reduction_pct = (latency_reduction_ms / cold_med) * 100

print(f"\n=== COMPARISON SUMMARY ===")
print(f"Baseline Median:       {cold_med:.1f} ms")
print(f"Improved Median:       {warm_med:.2f} ms")
print(f"Absolute Improvement:  {latency_reduction_ms:.1f} ms faster per query")
print(f"Relative Improvement:  {latency_reduction_pct:.2f}% latency reduction ({cold_med/warm_med:.0f}x speedup)")

# ── Save CSV ───────────────────────────────────────────────────────────────────
csv_rows = []
for i in range(N_RUNS):
    csv_rows.append({
        'run': i + 1,
        'cold_spawn_ms': round(cold_times[i], 2),
        'warm_in_memory_ms': round(warm_times[i], 2),
        'speedup_factor': round(cold_times[i] / warm_times[i], 1)
    })

csv_path = os.path.join(OUT_DIR, 'improvement_comparison.csv')
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['run', 'cold_spawn_ms', 'warm_in_memory_ms', 'speedup_factor'])
    w.writeheader()
    w.writerows(csv_rows)
print(f"Saved: {csv_path}")

json_path = os.path.join(OUT_DIR, 'improvement_summary.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump({
        'baseline_cold_spawn': {
            'runs': N_RUNS,
            'median_ms': round(cold_med, 2),
            'p95_ms': round(cold_p95, 2),
            'min_ms': round(min(cold_times), 2),
            'max_ms': round(max(cold_times), 2),
        },
        'improved_warm_in_memory': {
            'one_time_load_ms': round(one_time_load_ms, 2),
            'runs': N_RUNS,
            'median_ms': round(warm_med, 2),
            'p95_ms': round(warm_p95, 2),
            'min_ms': round(min(warm_times), 2),
            'max_ms': round(max(warm_times), 2),
        },
        'comparison': {
            'absolute_diff_ms': round(latency_reduction_ms, 2),
            'relative_reduction_pct': round(latency_reduction_pct, 2),
            'speedup_ratio': round(cold_med / warm_med, 1),
            'output_parity_verified': parity_check
        }
    }, f, indent=2)
print(f"Saved: {json_path}")
