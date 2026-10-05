#!/usr/bin/env python3

import json
from pymongo import MongoClient
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.preprocessing import normalize
import numpy as np
from scipy import sparse
import joblib
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

def main():
    client = MongoClient("mongodb://localhost:27017/")
    db = client['leetcode_db']
    problems_col = db['problems']

    problems = list(problems_col.find({}, {'_id': 0}))
    if not problems:
        print('No problems found in MongoDB collection "problems". Populate it first.')
        return

    # Build corpus from tags
    corpus = [" ".join(p.get('tags', [])) for p in problems]
    vectorizer = CountVectorizer()
    X = vectorizer.fit_transform(corpus)  # sparse matrix (n_problems x n_tags)

    # Normalize rows (L2) so cosine reduces to dot-product
    X_norm = normalize(X, norm='l2', axis=1)

    # Save artifacts
    vec_path = os.path.join(DATA_DIR, 'vectorizer.pkl')
    joblib.dump(vectorizer, vec_path)
    print('Saved vectorizer to', vec_path)

    mat_path = os.path.join(DATA_DIR, 'problems_matrix.npz')
    sparse.save_npz(mat_path, X_norm)
    print('Saved normalized problem matrix to', mat_path)

    meta = []
    tag_counts = {}
    for p in problems:
        meta.append({
            'title': p.get('title', ''),
            'titleSlug': p.get('titleSlug', ''),
            'tags': p.get('tags', []),
            'difficulty': p.get('difficulty', ''),
            'popularity': p.get('popularity', 0)
        })
        for t in p.get('tags', []):
            tag_counts[t] = tag_counts.get(t, 0) + 1

    meta_path = os.path.join(DATA_DIR, 'problems_meta.json')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2)
    print('Saved problems meta to', meta_path)

    tag_stats_path = os.path.join(DATA_DIR, 'tag_stats.json')
    with open(tag_stats_path, 'w', encoding='utf-8') as f:
        json.dump(tag_counts, f, indent=2)
    print('Saved tag stats to', tag_stats_path)

    # Also upsert tag_stats into MongoDB collection 'tag_stats' for convenience
    tag_stats_col = db['tag_stats']
    tag_stats_col.delete_many({})
    bulk = []
    for tag, count in tag_counts.items():
        bulk.append({'tag': tag, 'count': count})
    if bulk:
        tag_stats_col.insert_many(bulk)
        print('Wrote tag_stats into MongoDB collection "tag_stats"')

if __name__ == '__main__':
    main()
