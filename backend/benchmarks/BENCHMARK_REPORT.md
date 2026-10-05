# CPAI (CP Tracker) — Rigorous Performance & Quality Benchmark Report

> **Project**: Unified Competitive Programming & Learning Platform (CPAI)  
> **Repository**: [CP_Tracker](https://github.com/shafee777/CP_Tracker)  
> **Evaluation Date**: 2026-10-05  
> **Environment**: Windows 11, Node.js v20.16.0, Python 3.12.10, MongoDB 2.3.1 (mongosh) / WiredTiger local, Express on port 3000

---

## 1. Verified Implementation Facts (Code vs Description Audit)

| Component | Code Implementation | Audit Finding & Correction |
|---|---|---|
| **Vectorization** | `CountVectorizer()` + `normalize(X, norm='l2', axis=1)` | **NOT TF-IDF.** Uses unigram tag occurrence counts with L2 row normalization. No inverse document frequency (IDF) calculation exists. |
| **Similarity Metric** | Dot product on L2-normalized vectors | Equivalent to Cosine Similarity on tag count space. |
| **Popularity Weight** | `0.7 * sim + 0.3 * pop` | **Inactive in practice.** All 1,825 problems in `problems_meta.json` have `popularity: 0`, so the score reduces entirely to `0.7 * cosine_sim`. |
| **Recommendation Cache** | `NodeCache({ stdTTL: 300, checkperiod: 60 })` | **Fixed 5-minute TTL** (not sliding). Invalidation hook added to clear entries on profile updates. |
| **Submission Scraper** | `fetchAcceptedSubmissions.js` | **Fails with HTTP 401.** Hardcoded LeetCode session token expired; returns `{}`. |
| **Solved History Storage** | MongoDB `platformDetails.leetcode.solvedProblems` | **Partial/Wiped.** Users refreshed via `/all/combined` had stored slugs overwritten with `{}` due to the submission scraper failure. |

---

## 2. Recommender Core Computation Benchmark (200 Pooled Raw Runs)

Benchmark across **10 database user profiles** (0 to 219 stored solved slugs; 0 to 1,163 API-reported solved problems).  
Methodology: 3 warmup runs + 20 measured runs per profile.  
*All statistics below are recalculated directly from all 200 pooled raw runs, rather than combining per-profile quantiles.*

### Catalog & Model Specifications
- **Catalog Size**: 1,825 problems (`problems_meta.json`)
- **Difficulty Breakdown**: Easy: 477 (26.1%), Medium: 963 (52.8%), Hard: 385 (21.1%)
- **Feature Space**: 59 topic tags, sparse CSR matrix `(1825, 59)`
- **Artifact Load Time**: **5,654.0 ms** (one-time cold disk deserialization of vectorizer, matrix, and metadata)

### True Pooled Latency Across All 200 Runs
| Metric | Total Compute (ms) | Vector Build Phase (ms) | Candidate Search Phase (ms) |
|---|---|---|---|
| **Median** | **6.954 ms** | 0.130 ms | 6.851 ms |
| **p95** | **15.952 ms** | 3.841 ms | 12.261 ms |
| **Min** | 4.506 ms | 0.005 ms | 4.498 ms |
| **Max** | 22.397 ms | 5.210 ms | 18.210 ms |
| **Mean ± Std** | 8.847 ± 4.120 ms | 0.985 ± 1.340 ms | 7.862 ± 3.110 ms |

### Automated Constraint Verification
- **Catalog Validity**: **100.0%** (all 500 recommendations match existing catalog entries).
- **Duplicate Prevention**: **0 duplicate problems** within any user's recommendation set.
- **Solved Exclusion**: **0 stored solved problems were recommended** (verified against available stored history in MongoDB).

---

## 3. HTTP Recommendation Endpoint Benchmark (20 Misses vs 20 Hits)

Tested against live Express endpoint `GET /recommend/:username` on user `Thorfin_7` (profile with 219 stored solved problems).  
Comparable conditions: 20 fresh Python cold spawns (cache-miss via test header) vs 20 warm in-memory cache hits (`node-cache` fixed 300s TTL).

| Metric | Cache-Miss (Fresh Python Spawn) | Warm Cache-Hit (`NodeCache`) | Impact / Delta |
|---|---|---|---|
| **Completed Runs** | 20 / 20 (0 failures) | 20 / 20 (0 failures) | 100% success rate |
| **Median Latency** | **3,077.08 ms** | **6.20 ms** | **99.80% latency reduction** |
| **p95 Latency** | **3,216.35 ms** | **23.73 ms** | **135.5× p95 improvement** |
| **Min Latency** | 2,851.32 ms | 5.31 ms | Sub-10ms response time |
| **Max Latency** | 3,404.00 ms | 28.77 ms | Consistent bounds |
| **Output Consistency** | Content Hash: `bd7879f34a81` | Content Hash: `bd7879f34a81` | **100% match (0 drift)** |
| **Cache Type** | Bypassed via test header | Fixed 300s TTL from insertion | Verified fixed (not sliding) |

*Important distinction*: The 99.8% latency reduction reflects avoiding repeated disk artifact deserialization and process creation via caching; it does **not** represent a reduction in the time required for fresh vector computation.

---

## 4. Dashboard Backend Aggregation Latency (`POST /all/combined`)

Measures backend multi-platform data aggregation latency across **5 unique user profiles** (1 warmup + 5 measured runs per profile = 25 live runs) with 2.5s inter-run rate-limit pauses.

*Important distinction*: These numbers measure **backend aggregation round-trip latency**, not frontend dashboard loading or rendering time.

| Profile Handle | Runs | Success / Fail | Median (ms) | p95 (ms) | Observed Platform Health |
|---|---|---|---|---|---|
| `Shafee_77` | 5 | 5 / 0 | **1,509.81** | 1,755.36 | LC: success, CF: success, CC: success |
| `mohit` | 5 | 5 / 0 | **1,411.03** | 1,826.33 | LC: success, CF: success, CC: stale (fallback) |
| `sh_7` | 5 | 5 / 0 | **2,939.72** | 3,505.46 | LC: success, CF: failed (400), CC: success |
| `prem` | 5 | 5 / 0 | **1,919.50** | 2,059.76 | LC: success, CF: success, CC: stale (fallback) |
| `sh` | 5 | 5 / 0 | **1,646.54** | 1,677.42 | LC: success, CF: success, CC: stale (fallback) |

- **Overall Backend Aggregation Median**: **1,646.5 ms** (Range: 1,121 ms – 3,626 ms)
- **Isolated Component Timings**:
  - LeetCode GraphQL (`/all/leetcode`): **1,715.2 ms** median
  - Codeforces REST (`/all/codeforces`): **638.9 ms** median
  - CodeChef Cheerio Scraper (`/all/codechef`): **407.8 ms** median (susceptible to HTTP 429)
- **Fault Tolerance**: Under upstream rate limits, `allplatform.js` successfully degraded to last-known `stale` MongoDB profile data rather than returning HTTP 500 to the client.

---

## 5. Recommendation Quality & History Investigation

### Investigation into Missing Solved History
- **Root Cause**: `backend/utils/fetchAcceptedSubmissions.js` used an expired `LEETCODE_SESSION` cookie belonging to a single user. Live submission fetches fail with `HTTP 401 Unauthorized` and return `{}`.
- **Data Overwrite**: When `/all/combined` was executed during earlier testing, `allplatform.js` wrote `{}` into `platformDetails.leetcode.solvedProblems` in MongoDB, wiping stored history for refreshed accounts.
- **Verification Boundary**:
  > **Solved-problem exclusion is verified ONLY against the available stored problem slugs in MongoDB.** It cannot be verified against the user's unrecorded live solved history. For accounts with empty stored history, the recommender operates on a zero-history prior and cannot filter out problems solved on LeetCode.

### Quality Criteria & Metric Clarifications
- **Weak-Topic Coverage (100.0%)**:
  > **Weak-topic coverage is an algorithmic alignment check, NOT recommendation accuracy or pedagogical efficacy.**  
  Because weak topics are selected based on lowest solved counts and then used directly as candidate filters (`tag in problem.tags`), 100% coverage proves that candidate retrieval filters work as specified. It does not measure user learning improvement.
- **Precision@10**: **Unmeasured.** True precision requires independent human relevance grading. A 45-sample evaluation sheet has been generated at `backend/benchmarks/results/recommendation_eval_sheet.csv` with blank scoring columns for human review.

---

## 6. What Remains Unmeasured

1. **Frontend Time-to-Interactive (TTI)**: Total client-side browser render time until charts and heatmaps are visible.
2. **True Human Time Savings**: Human trial completion times between checking 3 websites manually vs using CPAI (blank worksheet provided in `time_saving_worksheet.csv`).
3. **Subjective Recommendation Relevance (Precision@10)**: Pending human evaluation of the 45-problem sample sheet.
