#!/usr/bin/env python3
"""
CPAI Time-Saving Worksheet Generator
=====================================
Creates the blank worksheet (CSV + printed table) for the manual timed experiment.
Human timings must be filled in by you after conducting trials.
Do NOT put recorded times here until you have actually measured them.

Usage: python benchmarks/gen_worksheet.py
"""

import csv, os, datetime

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'benchmarks', 'results')
os.makedirs(OUT_DIR, exist_ok=True)

# ── Scenario definitions ──────────────────────────────────────────────────────
# Information requirements (identical for both methods)
INFO_REQUIREMENTS = [
    "LeetCode total solved count",
    "LeetCode Easy / Medium / Hard breakdown",
    "LeetCode global ranking",
    "LeetCode contest count",
    "LeetCode current contest rating",
    "Codeforces current rating",
    "Codeforces max rating",
    "Codeforces total problems solved",
    "CodeChef current rating",
    "CodeChef total problems solved",
    # Slightly harder ones (require navigation)
    "LeetCode solved last week (from heatmap)",
    "Codeforces last 5 contests: rating change trend",
    "CodeChef last 3 contest names",
]

# 12 trials, alternating order to reduce practice effects
# A = Manual (visit 3 websites), B = CPAI dashboard
TRIAL_PLAN = []
for i in range(1, 13):
    order = 'A-then-B' if i % 2 == 1 else 'B-then-A'
    TRIAL_PLAN.append({
        'trial': i,
        'order': order,
        'info_requirement': INFO_REQUIREMENTS[(i - 1) % len(INFO_REQUIREMENTS)],
        'method_A_seconds': '',       # ← Fill after measuring
        'method_B_seconds': '',       # ← Fill after measuring
        'method_A_errors': '',        # number of wrong/missing values
        'method_B_errors': '',
        'notes': '',
    })

# Save blank CSV
csv_path = os.path.join(OUT_DIR, 'time_saving_worksheet.csv')
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=TRIAL_PLAN[0].keys())
    w.writeheader()
    w.writerows(TRIAL_PLAN)

print(f"Saved blank worksheet: {csv_path}")
print()

# Print the worksheet instructions
print("=" * 70)
print("CPAI TIME-SAVING EXPERIMENT — MEASUREMENT WORKSHEET")
print(f"Generated: {datetime.datetime.now().isoformat()}")
print("=" * 70)
print("""
SETUP
-----
Participant: ___________________________  Date: _____________
Browser: ___________________________     Connection: ___________

METHOD A (Manual): Open three browser tabs:
  1. https://leetcode.com/<your_username>
  2. https://codeforces.com/profile/<your_username>
  3. https://www.codechef.com/users/<your_username>
  Navigate to find each piece of information. Record time from
  first keystroke to writing down the value.

METHOD B (CPAI): Open the CPAI dashboard at http://localhost:5173/profile
  (or production URL). Record time from page-load-complete to
  writing down the value.

TIMING RULES
------------
- Start timer: when you press Enter to navigate to the first URL (A),
  or when the page finishes loading (B).
- Stop timer: when you have written down or highlighted the value.
- If value is NOT present, record "N/A" as the value and note the error.
- Do not pre-load pages; clear browser cache before each A trial.
- Alternate order per the plan below to reduce practice effects.

TRIALS
------
""")
header = f"{'Trial':>6} {'Order':>12} {'Information Required':<40} {'A (sec)':>8} {'B (sec)':>8} {'Notes'}"
print(header)
print("-" * len(header))
for t in TRIAL_PLAN:
    print(f"{t['trial']:>6} {t['order']:>12} {t['info_requirement']:<40} {'_____':>8} {'_____':>8}  {t['notes']}")

print("""
ANALYSIS (fill in after all trials)
-------------------------------------
Mean A: _____s   Median A: _____s   Std A: _____s
Mean B: _____s   Median B: _____s   Std B: _____s
Mean difference: _____s  (_____ %)
Error count A: _____   Error count B: _____

NOTE: Do not report a time-saving percentage until all rows are filled.
      The values above are BLANK until measured.
""")
print(f"CSV saved to: {csv_path}")
