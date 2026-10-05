"""ML recommender with weak-topic detection and persisted vectors.

This script expects precomputed artifacts in `backend/data/`:
- vectorizer.pkl
- problems_matrix.npz
- problems_meta.json
- tag_stats.json (optional, also stored in MongoDB collection `tag_stats`)

Run: `python backend/ml.py <username>`
"""
import sys
import json
import os
from pymongo import MongoClient
import numpy as np
import joblib
from scipy import sparse
from sklearn.preprocessing import normalize

ROOT = os.path.dirname(__file__)
DATA_DIR = os.path.join(ROOT, 'data')


def load_artifacts():
    vec_path = os.path.join(DATA_DIR, 'vectorizer.pkl')
    mat_path = os.path.join(DATA_DIR, 'problems_matrix.npz')
    meta_path = os.path.join(DATA_DIR, 'problems_meta.json')
    tag_stats_path = os.path.join(DATA_DIR, 'tag_stats.json')

    artifacts = {}
    if os.path.exists(vec_path) and os.path.exists(mat_path) and os.path.exists(meta_path):
        artifacts['vectorizer'] = joblib.load(vec_path)
        artifacts['matrix'] = sparse.load_npz(mat_path)
        with open(meta_path, 'r', encoding='utf-8') as f:
            artifacts['meta'] = json.load(f)
        if os.path.exists(tag_stats_path):
            with open(tag_stats_path, 'r', encoding='utf-8') as f:
                artifacts['tag_stats'] = json.load(f)
        return artifacts
    return None


def get_user_doc(db, username):
    # Try both possible collection names
    for col in ('auth_data', 'auth_datas', 'auth_datas', 'auth_data'):
        coll = db[col]
        doc = coll.find_one({
            '$or': [
                {'username': username},
                {'leetcodeUsername': username},
                {'email': username}
            ]
        })
        if doc:
            return doc
    return None


def build_slug_index(meta):
    slug2idx = {}
    for i, p in enumerate(meta):
        slug = p.get('titleSlug')
        if slug:
            slug2idx[slug] = i
    return slug2idx


def compute_user_vector_and_tags(matrix, meta, slug2idx, solved_slugs):
    solved_indices = [slug2idx[s] for s in solved_slugs if s in slug2idx]
    user_vec = None
    if solved_indices:
        sub = matrix[solved_indices]
        # average and normalize
        avg = sub.mean(axis=0)
        user_vec = np.asarray(avg).ravel()
        norm = np.linalg.norm(user_vec)
        if norm > 0:
            user_vec = user_vec / norm
    else:
        user_vec = np.zeros((matrix.shape[1],), dtype=float)

    # tag counts from solved problems
    user_tag_counts = {}
    for s in solved_slugs:
        idx = slug2idx.get(s)
        if idx is None:
            continue
        tags = meta[idx].get('tags', [])
        for t in tags:
            user_tag_counts[t] = user_tag_counts.get(t, 0) + 1

    return user_vec, user_tag_counts, set(solved_indices)


def recommend_for_user(username, top_n=10, mongo_uri='mongodb://localhost:27017/', db_name='leetcode_db'):
    artifacts = load_artifacts()
    if artifacts is None:
        return {'error': 'Artifacts missing. Run precompute_vectors.py first.'}

    client = MongoClient(mongo_uri)
    db = client[db_name]

    user_doc = get_user_doc(db, username)
    if not user_doc:
        return {'error': 'User not found in DB'}

    # load solved slugs from user doc
    solved = user_doc.get('platformDetails', {}).get('leetcode', {}).get('solvedProblems', {})
    if isinstance(solved, dict):
        solved_slugs = set(solved.keys())
    elif isinstance(solved, list):
        solved_slugs = set(solved)
    else:
        solved_slugs = set()

    meta = artifacts['meta']
    matrix = artifacts['matrix']
    slug2idx = build_slug_index(meta)

    user_vec, user_tag_counts, solved_indices = compute_user_vector_and_tags(matrix, meta, slug2idx, solved_slugs)

    # load tag stats
    tag_stats = artifacts.get('tag_stats') or {}
    if not tag_stats:
        # try Mongo
        tag_stats_col = db['tag_stats']
        for doc in tag_stats_col.find({}):
            tag_stats[doc['tag']] = doc.get('count', 0)

    # compute proficiency per tag
    alpha = 1.0
    prof = {}
    for tag, total in tag_stats.items():
        solved_c = user_tag_counts.get(tag, 0)
        prof[tag] = (solved_c + alpha) / (total + alpha)

    # pick weak tags (lowest proficiency) but require total >= 5
    candidates = [(t, p, tag_stats.get(t, 0)) for t, p in prof.items() if tag_stats.get(t, 0) >= 5]
    candidates.sort(key=lambda x: x[1])
    weak_tags = candidates[:5]

    # load tag->algorithms mapping
    tag_algo_path = os.path.join(DATA_DIR, 'tag_to_algorithms.json')
    tag_algos = {}
    if os.path.exists(tag_algo_path):
        with open(tag_algo_path, 'r', encoding='utf-8') as f:
            tag_algos = json.load(f)

    recommendations_by_tag = {}

    # Precompute popularity array if present
    popularity = np.array([p.get('popularity', 0) for p in meta], dtype=float)
    if popularity.max() > 0:
        pop_norm = (popularity - popularity.min()) / (popularity.max() - popularity.min())
    else:
        pop_norm = np.zeros_like(popularity)

    # For quick dot products, ensure matrix is in CSR
    mat_csr = matrix.tocsr()

    for tag, p_score, total in weak_tags:
        # find candidate indices
        cand_idxs = [i for i, pm in enumerate(meta) if (tag in pm.get('tags', [])) and (pm.get('titleSlug') not in solved_slugs)]
        if not cand_idxs:
            recommendations_by_tag[tag] = []
            continue

        # similarity via dot product since we normalized rows
        if np.linalg.norm(user_vec) > 0:
            sims = mat_csr[cand_idxs].dot(user_vec)
            sims = np.asarray(sims).ravel()
        else:
            sims = np.zeros(len(cand_idxs))

        pops = pop_norm[cand_idxs]

        # composite score: 0.7*sim + 0.3*pop
        scores = 0.7 * sims + 0.3 * pops
        top_idx_order = np.argsort(scores)[::-1][:top_n]

        recs = []
        for ix in top_idx_order:
            i = cand_idxs[int(ix)]
            pm = meta[i]
            recs.append({
                'title': pm.get('title'),
                'titleSlug': pm.get('titleSlug'),
                'tags': pm.get('tags', []),
                'difficulty': pm.get('difficulty', ''),
                'popularity': pm.get('popularity', 0)
            })

        recommendations_by_tag[tag] = recs

    # format weak tags output
    weak_tags_out = [{'tag': t, 'proficiency': float(prof.get(t, 0)), 'total': int(tag_stats.get(t, 0))} for t, _, _ in weak_tags]

    return {
        'username': username,
        'weak_tags': weak_tags_out,
        'tag_algorithms': tag_algos,
        'recommendations_by_tag': recommendations_by_tag
    }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Username not provided'}))
        sys.exit(1)

    username = sys.argv[1]
    out = recommend_for_user(username)
    print(json.dumps(out))


