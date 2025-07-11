// file: frontend/src/components/RecomModel.jsx
import React, { useState } from "react"
import {Search, Brain, Target, Clock, Tag, TrendingUp, User,Sparkles, AlertCircle, CheckCircle} from "lucide-react"

const RecomModel = () => {
  const [username, setUsername] = useState("")
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "hard":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getTagColor = () => {
    return "bg-gray-200 text-gray-700"
  }

  const fetchRecommendations = async () => {
    if (!username.trim()) {
      setError("Please enter a LeetCode username")
      setSuccess("")
      setRecommendations([])
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")
    setRecommendations([])

    try {
      const response = await fetch(`http://localhost:3000/recommend/${username}`)

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations")
      }

      const data = await response.json()
      setRecommendations(data.recommended)
      setSuccess(`Found ${data.recommended.length} personalized recommendations!`)
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") fetchRecommendations()
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-10 bg-white rounded-3xl shadow-lg border border-gray-200">
      {/* Header */}
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-4 mb-4">
          <div className="p-4 rounded-full bg-gray-900 shadow-md">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            AI Problem Recommender
          </h1>
        </div>
        <p className="text-gray-700 max-w-3xl mx-auto text-lg font-normal">
          Personalized LeetCode problem suggestions tailored to your Problem Solved history.
        </p>
      </header>
      <div className="w-full max-w-4xl mx-auto mb-6">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-300 rounded-xl shadow-sm">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
            <div className="text-sm text-yellow-800 leading-snug">
            <strong className="font-semibold">Note:</strong> You must be <span className="font-medium">logged in</span> before using the <span className="font-medium">AI Problem Recommender</span>.
            </div>
        </div>
        </div>

      {/* Input Section */}
      <section className="mb-10 max-w-3xl mx-auto">
        <label htmlFor="username" className="flex items-center gap-3 text-lg font-semibold mb-3 text-gray-900">
          <User className="w-5 h-5" />
          LeetCode Username
        </label>
        <div className="flex gap-4">
          <input
            id="username"
            type="text"
            placeholder="Enter your LeetCode username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
          />
          <button
            onClick={fetchRecommendations}
            disabled={loading || !username.trim()}
            className="px-7 py-3 bg-gray-900 text-white font-semibold rounded-xl flex items-center gap-3 justify-center transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 shadow-md"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Get Recommendations
              </>
            )}
          </button>
        </div>
      </section>

      {/* Success and Error Notifications */}
      <section className="max-w-3xl mx-auto mb-8">
        {success && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-300 rounded-xl px-6 py-4 shadow-sm text-green-800 font-semibold">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-300 rounded-xl px-6 py-4 shadow-sm text-red-800 font-semibold">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* How it works */}
      {!loading && recommendations.length === 0 && !error && (
        <section className="max-w-4xl mx-auto bg-white rounded-xl p-8 shadow border border-gray-200">
          <header className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-gray-900" />
            <h2 className="text-xl font-bold text-gray-900">How It Works</h2>
          </header>
          <ol className="grid md:grid-cols-3 gap-6 text-gray-700 text-base font-normal">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <p>We analyze your solved problems to discover patterns in topics and difficulty.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <p>Our ML model employs cosine similarity to find problems matching your profile.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <p>Receive personalized problem recommendations that fit your skill level and preferences.</p>
            </li>
          </ol>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="max-w-5xl mx-auto mt-10">
          <div className="flex items-center gap-3 mb-8">
            <Target className="w-6 h-6 text-gray-900" />
            <h2 className="text-2xl font-bold text-gray-900">
              Recommended Problems for{" "}
              <span className="font-semibold text-gray-800">{username}</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {recommendations.map((problem, index) => (
                <article
                key={index}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                {/* Top Row */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    {/* Problem Info */}
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-gray-900 font-bold text-lg">#{index + 1}</span>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{problem.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className={`px-3 py-0.5 rounded-full font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                        </span>
                        <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Recommended for you</span>
                        </div>
                    </div>
                    </div>

                    {/* Solve Button */}
                    <div className="flex-shrink-0">
                    <a
                        href={`https://leetcode.com/problems/${problem.titleSlug}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-900 hover:bg-gray-800 text-white py-2 px-5 rounded-lg font-semibold flex items-center gap-2 transition shadow"
                        aria-label={`Solve ${problem.title} on LeetCode`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Solve
                    </a>
                    </div>
                </div>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-gray-600">
                    <Tag className="w-4 h-4" />
                    {problem.tags.map((tag, tagIndex) => (
                    <span
                        key={tagIndex}
                        className={`px-2 py-0.5 rounded-md text-xs font-medium ${getTagColor(tagIndex)}`}
                    >
                        {tag}
                    </span>
                    ))}
                </div>
                </article>
            ))}
            </div>

        </section>
      )}
    </div>
  )
}

export default RecomModel