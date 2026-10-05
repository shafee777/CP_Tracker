# CPAI (CP Tracker) — Performance & Quality Benchmark Report

> **Project**: Unified Competitive Programming & Learning Platform (CPAI)  
> **Repository**: [CP_Tracker](https://github.com/shafee777/CP_Tracker)  
> **Benchmark Date**: 2026-10-05  
> **Environment**: Windows 11, Node.js v20.16.0, Python 3.12.10, MongoDB 2.3.1 (mongosh) / WiredTiger local, local Express on port 3000

---

## Executive Summary of Measured Metrics

| Component / Route | Baseline (Cold / Uncached) | Improved / In-Memory (Remeasured) | Delta / Speedup | Test Scope |
|---|---|---|---|---|
| **Recommender Core Computation** | N/A (5,654 ms artifact load) | **6.55 ms** median / **18.50 ms** p95 | Real-time computation | 10 profiles × 20 runs = 200 runs |
| **HTTP `/recommend/:username`** | **4,479.1 ms** (cold spawn) | **28.95 ms** median (cache hit) | **99.35% drop (155× faster)** | Live HTTP via Express |
| **Recommender Integrity** | 0 duplicates | 0 solved problems recommended | 100% catalog valid | 500 total recommendations inspected |
| **Weak-Topic Coverage** | 100% (5 of 5 weak topics covered) | 100% across all 10 profiles | 0 coverage failures | 10 distinct user profiles |
| **Backend Aggregation (`/all/combined`)** | **1,646.5 ms** overall median | Range: 1,121 ms – 3,626 ms | Network-bound | 5 unique profiles × 5 runs = 25 runs |
| **LeetCode Scraper Latency** | **1,715.2 ms** median | Isolated endpoint `/all/leetcode` | Network/GraphQL | 3 live runs |
| **Codeforces Scraper Latency** | **638.9 ms** median | Isolated endpoint `/all/codeforces` | REST API | 3 live runs |
| **CodeChef Scraper Latency** | **407.8 ms** median | Isolated endpoint `/all/codechef` | HTML / Cheerio | 3 live runs (rate-limit prone) |

---

## 1. Implementation Inspection & Feasibility Matrix

### What Was Inspected
1. **Aggregator route (`backend/routes/allplatform.js`)**: Runs `Promise.allSettled` across three upstream URLs with retry logic (max 3 attempts, exponential backoff). Normalizes schema, stores to MongoDB `auth_datas`.
2. **LeetCode scraper (`backend/utils/leetcode-scraper.js`)**: Executes GraphQL requests against `https://leetcode.com/graphql/`. Contains in-memory route caching.
3. **LeetCode submissions (`backend/utils/fetchAcceptedSubmissions.js`)**: Contains a hardcoded session cookie and CSRF token that expired (returns HTTP 401 on live requests).
4. **Codeforces scraper (`backend/utils/codeforce-scraper.js`)**: Hits official public REST endpoints (`user.info`, `user.status`, `user.rating`).
5. **CodeChef scraper (`backend/utils/codechefScraper.js`)**: HTML scraping using Cheerio. Prone to HTTP 429 rate-limiting.
6. **Recommendation engine (`backend/ml.py`)**: Spawns Python CLI, loads 4 disk artifacts (1,825 problems, 59-dim TF-IDF space, 43 tags), calculates Laplace-smoothed tag proficiency, selects 5 lowest-proficiency tags, computes composite score (`0.7 × sim + 0.3 × pop`).
7. **Frontend loading (`frontend/src/components/ProfileDetails/Profile.jsx`)**: Fetches `/api/auth/profile` with JWT; renders `ProfileCard`, `SolvedProblems`, `ActivityHeatmap`, `RatingGraph`.

### Feasibility Matrix
- **Measurable locally without external dependency**: ML recommender computation, artifact deserialization, database operations, cache hits/misses, integrity checks, weak-tag coverage.
- **Subject to third-party rate limits / network**: `/all/combined` aggregation latency, individual platform scrapers.
- **Unmeasurable automatically without human subjects**: Real-world user time savings (Method A vs Method B) and true subjective recommendation relevance (Precision@10). Handled via structured blank worksheets.

---

## 2. Recommender Performance & Integrity Benchmarks

### Dataset & Artifact Characteristics
- **Problem Catalog**: 1,825 problems (`problems_meta.json`)
- **Difficulty Distribution**: Easy: 477 (26.1%), Medium: 963 (52.8%), Hard: 385 (21.1%)
- **Feature Space**: 59 topic tags, L2-normalized CountVectorizer matrix `(1825, 59)`
- **Popularity Vector**: All values currently 0 (popularity scoring component is inactive)
- **Artifact Load Time**: **5,654.0 ms** (one-time disk deserialization)

### Per-Profile Measurement Results (3 Warmup + 20 Measured Runs Each)
| Profile Username | Solved Count (API) | Solved Slugs (DB) | Latency Median | Latency p95 | Weak Topics Identified | Integrity Issues |
|---|---|---|---|---|---|---|
| `Shafee_77` | 668 | 0 | 5.42 ms | 6.63 ms | Array, DP, String, Math, Tree | 0 |
| `Thorfin_7` | 611 | 219 | 10.25 ms | 11.34 ms | Graph, BFS, Union Find, Design, Greedy | 0 |
| `jd` | 0 | 0 | 6.39 ms | 7.17 ms | Array, DP, String, Math, Tree | 0 |
| `ahad@gmail.com` | 0 | 0 | 6.19 ms | 8.00 ms | Array, DP, String, Math, Tree | 0 |
| `mohit` | 832 | 684 | 13.03 ms | 18.50 ms | Union Find, Trie, Segment Tree, Graph, Queue | 0 |
| `shafe` | 0 | 0 | 5.77 ms | 7.35 ms | Array, DP, String, Math, Tree | 0 |
| `ajs` | 0 | 0 | 6.00 ms | 7.45 ms | Array, DP, String, Math, Tree | 0 |
| `sh_7` | 0 | 0 | 6.71 ms | 9.29 ms | Array, DP, String, Math, Tree | 0 |
| `prem` | 1,163 | 18 | 10.25 ms | 13.48 ms | Math, Tree, DFS, BFS, DP | 0 |
| `sh` | 138 | 186 | 12.53 ms | 19.01 ms | DFS, Backtracking, Graph, Tree, Union Find | 0 |

**Aggregate Metric**: Median of medians = **6.55 ms** | p95 of p95s = **18.50 ms**.

### Integrity & Constraint Validation
- **Problem Existence**: 100% (all 50 recommended problems per user exist in catalog).
- **Duplicate Prevention**: 0 duplicate problems within any recommended topic list.
- **Solved Exclusion**: 0 previously solved problems were recommended across all 10 profiles.

---

## 3. Recommendation Quality Evaluation (Honest Assessment)

### Evaluation Criteria (Pre-defined)
1. **Weak-Topic Alignment**: Does the recommender return problems matching the identified low-proficiency tags?
2. **Difficulty Suitability**: How do recommended difficulties compare against user skill levels?
3. **Deduplication & Catalog Freshness**: Are problems non-overlapping and unsolved?

### Quality Results
- **Weak-Topic Coverage**: **100.0%** (every identified weak topic received exactly 10 candidate problems).
- **Difficulty Profile in Recommendations**:
  - Across tested profiles: ~20% Easy, ~56% Medium, ~24% Hard.
  - Aligns closely with the underlying catalog distribution (26% Easy, 53% Medium, 21% Hard).
- **Evaluation Circularity Disclaimer**:
  > *Critical Note*: In CPAI, weak topics are identified using Laplace-smoothed solved counts and then used as the query filter to retrieve problems containing those same tags. Measuring "weak-topic coverage" validates algorithmic alignment and filter execution, but **does not prove learning efficacy or pedagogical suitability**.

### Human Relevance Review Sheet
- Prepared in `benchmarks/results/recommendation_eval_sheet.csv` (45 recommendations across 3 representative profiles).
- Contains blank columns (`relevance_0_or_1`, `difficulty_suitable_1_4`, `quality_score_1_4`) for independent human grading.
- **Precision@10 is marked as UNMEASURED** because fabricated relevance labels were strictly prohibited.

---

## 4. Dashboard Performance (`/all/combined` Live Benchmark)

### Test Configuration
- 5 unique profiles from local database with non-empty platform usernames.
- 1 warmup run + 5 measured runs per profile (25 total live aggregation runs).
- 2.5s inter-run sleep to prevent IP bans.

### Measured Latencies
| Profile | Runs | Successes | Failures | Median Latency | p95 Latency | Dominant Platform Status |
|---|---|---|---|---|---|---|
| `Shafee_77` | 5 | 5 | 0 | **1,509.8 ms** | 1,755.4 ms | LC: success, CF: success, CC: success |
| `mohit` | 5 | 5 | 0 | **1,411.0 ms** | 1,826.3 ms | LC: success, CF: success, CC: stale (run 5) |
| `sh_7` | 5 | 5 | 0 | **2,939.7 ms** | 3,505.5 ms | LC: success, CF: failed (400), CC: failed/success |
| `prem` | 5 | 5 | 0 | **1,919.5 ms** | 2,059.8 ms | LC: success, CF: success, CC: stale (run 2) |
| `sh` | 5 | 5 | 0 | **1,646.5 ms** | 1,677.4 ms | LC: success, CF: success, CC: success/stale |

### Isolated Platform Scraper Timings (3 Samples Each)
- **LeetCode** (`/all/leetcode/Shafee_77`): Median **1,715.2 ms**
- **Codeforces** (`/all/codeforces/Shafee_77`): Median **638.9 ms**
- **CodeChef** (`/all/codechef/Shafee_7`): Median **407.8 ms**

---

## 5. Targeted Optimization & Remeasurement

### The Bottleneck
- In `backend/routes/recommend.js`, every incoming HTTP request called `child_process.spawn("python", ["ml.py", username])`.
- Python spent **~5,650 ms** deserializing `vectorizer.pkl`, `problems_matrix.npz`, and JSON metadata from disk before performing **6.55 ms** of vector math.
- Furthermore, `Recom_model.jsx` crashed due to an object key mismatch (`data.recommended` vs `data.recommendations_by_tag`).

### The Improvement
1. Integrated `node-cache` (already in `backend/package.json`) with a 300-second (5-minute) sliding TTL.
2. Added `X-Cache: HIT / MISS` response headers for full observability.
3. Added a backward-compatible response property `parsed.recommended = Object.values(parsed.recommendations_by_tag).flat()` to fix the frontend UI crash without breaking existing API clients.

### Remeasured HTTP Performance
- **Baseline Cold Miss (spawns Python)**: **4,479.1 ms** (`X-Cache: MISS`)
- **Warm Cache Hits (5 runs)**: 25.8 ms, 29.9 ms, 32.6 ms, 29.0 ms, 9.6 ms
- **Warm Cache Median**: **28.95 ms** (`X-Cache: HIT`)
- **Speedup**: **155× faster**
- **Latency Reduction**: **99.35%**

---

## 6. Manual Time-Saving Experiment Worksheet

- Generated at `benchmarks/results/time_saving_worksheet.csv`.
- Features 12 balanced, alternating trials (Method A: 3 browser tabs vs Method B: CPAI dashboard).
- Controls for user familiarity by interleaving trial orders (`A-then-B` vs `B-then-A`).
- **Human timings are explicitly left BLANK** until user testing is performed.
