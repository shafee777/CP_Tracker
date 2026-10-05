#!/usr/bin/env python3
"""
CPAI Recommendation Quality — Human Evaluation Sheet Generator
==============================================================
Generates a CSV evaluation sheet for a human judge to review recommendations
for 3 real profiles across weak topics.

Criteria for judging:
  1. Does this problem genuinely test the indicated topic?
  2. Is the difficulty appropriate for someone weak in this topic?
  3. Would you recommend this problem to an intermediate solver?

Score: 1 (poor), 2 (borderline), 3 (good), 4 (excellent)
Relevance: 1 = Relevant, 0 = Irrelevant

Usage: python benchmarks/gen_eval_sheet.py
"""

import sys, os, json, csv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'benchmarks', 'results')
os.makedirs(OUT_DIR, exist_ok=True)

# Run a single recommendation pass for 3 key profiles
sys.path.insert(0, ROOT)
from pymongo import MongoClient
import joblib, numpy as np
from scipy import sparse

DATA_DIR = os.path.join(ROOT, 'data')
meta = json.load(open(os.path.join(DATA_DIR, 'problems_meta.json'), 'r', encoding='utf-8'))
mat = sparse.load_npz(os.path.join(DATA_DIR, 'problems_matrix.npz'))
tag_stats = json.load(open(os.path.join(DATA_DIR, 'tag_stats.json'), 'r', encoding='utf-8'))
slug2idx = {p['titleSlug']: i for i, p in enumerate(meta) if p.get('titleSlug')}

client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=3000)
db = client['leetcode_db']

target_users = ['Shafee_77', 'mohit', 'prem']
rows = []

for u_name in target_users:
    u = db['auth_datas'].find_one({'$or': [{'username': u_name}, {'leetcodeUsername': u_name}]})
    if not u:
        continue
    pd = (u.get('platformDetails') or {}).get('leetcode') or {}
    sp = pd.get('solvedProblems') or {}
    solved_slugs = set(sp.keys()) if isinstance(sp, dict) else set(sp)

    # compute user vec
    indices = [slug2idx[s] for s in solved_slugs if s in slug2idx]
    if indices:
        avg = np.asarray(mat[indices].mean(axis=0)).ravel()
        norm = np.linalg.norm(avg)
        u_vec = avg / norm if norm > 0 else avg
    else:
        u_vec = np.zeros(mat.shape[1])

    # weak tags
    import collections
    tag_counts = collections.Counter()
    for s in solved_slugs:
        idx = slug2idx.get(s)
        if idx is not None:
            for t in meta[idx].get('tags', []):
                tag_counts[t] += 1
    prof = {t: (tag_counts.get(t,0)+1.0)/(total+1.0) for t, total in tag_stats.items() if total >= 5}
    weak = sorted(prof.items(), key=lambda x: x[1])[:3]  # top 3 weak tags

    mat_csr = mat.tocsr()
    for tag, p_score in weak:
        cands = [i for i, pm in enumerate(meta) if tag in pm.get('tags',[]) and pm.get('titleSlug') not in solved_slugs]
        if not cands: continue
        sims = np.asarray(mat_csr[cands].dot(u_vec)).ravel() if np.linalg.norm(u_vec) > 0 else np.zeros(len(cands))
        top_cands = [cands[i] for i in np.argsort(sims)[::-1][:5]]  # top 5 per weak tag

        for rank, ci in enumerate(top_cands, 1):
            p = meta[ci]
            rows.append({
                'profile': u.get('username','?'),
                'solved_count': len(solved_slugs),
                'weak_topic': tag,
                'proficiency_score': round(p_score, 4),
                'rank': rank,
                'problem_title': p['title'],
                'slug': p['titleSlug'],
                'difficulty': p['difficulty'],
                'all_tags': '|'.join(p.get('tags',[])),
                'link': f"https://leetcode.com/problems/{p['titleSlug']}/",
                # Columns for human reviewer to fill
                'relevance_0_or_1': '',       # 1=relevant, 0=irrelevant
                'difficulty_suitable_1_4': '', # 1=too easy/hard, 4=perfect
                'quality_score_1_4': '',       # overall quality
                'reviewer_notes': '',
            })

csv_path = os.path.join(OUT_DIR, 'recommendation_eval_sheet.csv')
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=rows[0].keys())
    w.writeheader()
    w.writerows(rows)

print(f"Generated evaluation sheet with {len(rows)} rows: {csv_path}")
print("Columns 'relevance_0_or_1', 'difficulty_suitable_1_4', 'quality_score_1_4' are BLANK for human review.")
