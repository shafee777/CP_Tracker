🧠 CPAI - Competitive Programming AI (UCPLP)

**CPAI (Unified Competitive Programming & Learning Platform)** is an all-in-one dashboard that aggregates your profiles from **LeetCode**, **Codeforces**, and **CodeChef**. It provides insightful stats, personalized problem recommendations using ML, visual progress tracking, contest data, and more — all in one place.

---

## 🚀 Features

- 📊 **Unified Profile Dashboard**: View ratings, problem count, contest history across multiple platforms.
- 🤖 **AI-Powered Recommendations**: ML-based problem suggestions tailored to your strengths and weaknesses.
- 🔥 **Activity Heatmap**: GitHub-style calendar showing daily problem-solving history.
- 📈 **Rating Graphs**: Interactive platform-wise rating history.
- 🧪 **Rating Predictor**: Predict LeetCode rating changes for recent contests.
- 🗓️ **Contest Tracker**: View upcoming contests from all platforms with links and countdowns.

---

## 🧩 Tech Stack

### 🔹 Frontend
- **React + Vite**: Fast and modern frontend development
- **Tailwind CSS**: Utility-first styling for sleek UI
- **React Router**: Navigation between app sections

### 🔹 Backend
- **Node.js + Express**: RESTful API server
- **Python**: Machine Learning integration
- **MongoDB**: Stores user data and problem metadata
- **Cheerio / APIs / GraphQL**: For scraping CodeChef, Codeforces, and LeetCode

---

## 📦 Installation

### 1. Clone the repository

git clone https://github.com/your-username/cpai.git
cd cpai

### 2. Install dependencies
   
**Frontend**:
cd frontend
npm install

**Backend**:
cd backend
npm install

### 3. Setup environment variables
Make sure You have MongoDb Atlas App

### 4. Start the project
   
**Backend**:
cd backend
Node index.js

**Frontend**:
cd frontend
npm run dev

🧠 ML Recommendation System
The ML engine fetches the user's solved problems, extracts tags, and matches them against a database of unsolved problems using cosine similarity (TF-IDF). The backend invokes Python via child_process.spawn() to return the top 10 recommendations.

📚 API Endpoints
Endpoint	Description
/all/:platform/:username	Fetch user data from LeetCode, Codeforces, or CodeChef
/all/combined/:username	Unified profile from all platforms
/recommend/:username	AI problem recommendations
/predict/:username/:contest	LeetCode rating prediction
/contests/upcoming	Aggregated upcoming contests


🤝 Contributing
Contributions, suggestions, and feedback are welcome! If you'd like to contribute:

git clone https://github.com/your-username/cpai.git

📄 License
MIT License

✍️ Author
Mohamed Shafee M
