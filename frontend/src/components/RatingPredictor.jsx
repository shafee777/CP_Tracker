// frontend/src/components/RatingPredictor.jsx
import React from "react"
import { useState } from "react"
import { Search, TrendingUp, TrendingDown, User, Calendar, Trophy, Target, Zap } from "lucide-react"

const RatingPredictor = () => {
  const [username, setUsername] = useState("")
  const [contest, setContest] = useState("")
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchPrediction = async () => {
    if (!username || !contest) {
      setError("Please fill in both fields.")
      return
    }
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch(`/api/lccn/${username}/predict/${contest}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch prediction.")
      }
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchPrediction()
    }
  }

  // Static text colors: overrides dynamic rating colors
  const staticRatingTextColor = "text-gray-800"
  const staticBadgeColor = "bg-gray-400"

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gray-800 shadow-lg">
            <Target className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">LeetCode Rating Predictor</h2>
        </div>
        <p className="text-gray-600">Predict your rating changes for LeetCode contests</p>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="w-4 h-4" />
            Username
          </label>
          <input
            type="text"
            placeholder="e.g., johndoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Trophy className="w-4 h-4" />
            Contest Name
          </label>
          <input
            type="text"
            placeholder="e.g., weekly-contest-455"
            value={contest}
            onChange={(e) => setContest(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={fetchPrediction}
        disabled={loading || !username || !contest}
        className="w-full bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed shadow-lg"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Fetching Prediction...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Get Prediction
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
      <div className="mt-8 space-y-6">
        {/* Contest Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-indigo-600" />
              {result.contestName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <Calendar className="w-4 h-4" />
              {result.date}
            </div>
          </div>

          {/* Rating Change Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
              <p className="text-sm text-indigo-500 mb-1">Current Rating</p>
              <p className={`text-2xl font-bold text-indigo-900`}>{result.rating}</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
              <p className="text-sm text-indigo-500 mb-1">Rating Change</p>
              <div className="flex items-center justify-center gap-1">
                {result.delta >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <p className={`text-2xl font-bold ${result.delta >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {result.delta > 0 ? `+${result.delta}` : result.delta}
                </p>
              </div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
              <p className="text-sm text-indigo-500 mb-1">Predicted Rating</p>
              <p className="text-2xl font-bold text-indigo-900">
                {result.predictedRating}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Results Table */}
        <div className="bg-white rounded-xl border border-indigo-200 overflow-hidden shadow-lg">
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-200">
            <h4 className="text-lg font-semibold text-indigo-900">Contest Results</h4>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">
                    Old Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">
                    New Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-indigo-200">
                <tr className="hover:bg-indigo-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      #{result.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span className="font-medium text-indigo-900">{username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-indigo-700">{result.country || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-indigo-900">{result.rating}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {result.delta >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`font-semibold ${result.delta >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {result.delta > 0 ? `+${result.delta}` : result.delta}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-indigo-900">
                        {result.predictedRating}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.predictedRating >= 2400
                            ? "bg-red-600"
                            : result.predictedRating >= 2300
                            ? "bg-red-500"
                            : result.predictedRating >= 2100
                            ? "bg-yellow-600"
                            : result.predictedRating >= 1900
                            ? "bg-purple-600"
                            : result.predictedRating >= 1600
                            ? "bg-pink-600"
                            : result.predictedRating >= 1400
                            ? "bg-blue-600"
                            : result.predictedRating >= 1200
                            ? "bg-green-600"
                            : "bg-gray-500"
                        } text-white`}
                      >
                        {(() => {
                          if (result.predictedRating >= 2400) return "Legendary Grandmaster"
                          if (result.predictedRating >= 2300) return "International Grandmaster"
                          if (result.predictedRating >= 2100) return "Grandmaster"
                          if (result.predictedRating >= 1900) return "International Master"
                          if (result.predictedRating >= 1600) return "Candidate Master"
                          if (result.predictedRating >= 1400) return "Expert"
                          if (result.predictedRating >= 1200) return "Specialist"
                          return "Pupil"
                        })()}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
            {/* Mobile Card */}
            <div className="md:hidden p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Rank</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                    #{result.rank}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Username</span>
                  <span className="font-medium text-gray-900">{username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Region</span>
                  <span className="text-gray-600">{result.country || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Old Rating</span>
                  <span className={`font-semibold ${staticRatingTextColor}`}>{result.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Change</span>
                  <div className="flex items-center gap-1 text-gray-800">
                    {result.delta >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-semibold">
                      {result.delta > 0 ? `+${result.delta}` : result.delta}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">New Rating</span>
                  <span className={`font-semibold ${staticRatingTextColor}`}>
                    {result.predictedRating}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-300">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-gray-700" />
              <h4 className="text-lg font-semibold text-blue-900">Performance Score</h4>
            </div>
            <p className="text-gray-700">
              <span className="font-semibold">Problems Solved Score:</span> {result.problemsSolved} /{"18"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RatingPredictor