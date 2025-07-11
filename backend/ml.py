# backend/ml.py
from pymongo import MongoClient
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json


class ProblemRecommender:
    def __init__(self, mongo_uri="mongodb://localhost:27017/", db_name="leetcode_db"):
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.problems_col = self.db["problems"]
        self.user_data_col = self.db["auth_datas"]

    def get_user_solved_problems(self, leetcode_username):
        user_doc = self.user_data_col.find_one({"leetcodeUsername": leetcode_username})
        if user_doc:
            solved = user_doc.get("platformDetails", {}) \
                             .get("leetcode", {}) \
                             .get("solvedProblems", {})
            return set(solved.keys())
        return set()

    def get_all_problems(self):
        return list(self.problems_col.find({}, {"_id": 0}))

    def prepare_tag_corpus(self, problems):
        return [" ".join(prob.get("tags", [])) for prob in problems]

    def recommend(self, leetcode_username, top_n=10):
        all_problems = self.get_all_problems()

        solved_ids = self.get_user_solved_problems(leetcode_username)


        if not all_problems:
            print("No problems found in database.")
            return []

        solved_problems = [p for p in all_problems if p.get("titleSlug") in solved_ids]
        unsolved_problems = [p for p in all_problems if p.get("titleSlug") not in solved_ids]

        if not solved_problems:
            print("User has not solved any problems yet.")
            difficulty_order = {"easy": 1, "medium": 2, "hard": 3}
            unsolved_problems.sort(key=lambda x: difficulty_order.get(x.get("difficulty", ""), 4))
            return unsolved_problems[:top_n]

        solved_corpus = self.prepare_tag_corpus(solved_problems)
        unsolved_corpus = self.prepare_tag_corpus(unsolved_problems)

        vectorizer = CountVectorizer()
        all_corpus = solved_corpus + unsolved_corpus
        tag_vectors = vectorizer.fit_transform(all_corpus)

        solved_vectors = tag_vectors[:len(solved_corpus)]
        unsolved_vectors = tag_vectors[len(solved_corpus):]

        user_profile = np.asarray(solved_vectors.mean(axis=0)).reshape(1, -1)
        similarities = cosine_similarity(user_profile, unsolved_vectors).flatten()
        top_indices = similarities.argsort()[::-1][:top_n]
        recommended_problems = [unsolved_problems[i] for i in top_indices]

        return recommended_problems


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print(json.dumps({"error": "Username not provided"}))
        sys.exit(1)

    username = sys.argv[1]

    recommender = ProblemRecommender(mongo_uri="mongodb://localhost:27017/", db_name="leetcode_db")
    recommendations = recommender.recommend(username, top_n=10)


    output = []
    for prob in recommendations:
        output.append({
            "title": prob.get("title", ""),
            "difficulty": prob.get("difficulty", ""),
            "tags": prob.get("tags", []),
            "titleSlug": prob.get("titleSlug", ""),
        })

    print(json.dumps({
        "username": username,
        "recommended": output
    }))

