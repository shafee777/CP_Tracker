// frontend/src/components/ProfileDetails/SolvedProblems.jsx
import React from "react"
import { SiLeetcode, SiCodeforces, SiCodechef } from "react-icons/si"
import { ExternalLink, Trophy } from "lucide-react"

export default function SolvedProblems({ solved, difficult }) {
  const { total, leetcode, codeforces, codechef, leetcodeUsername, codeforcesUsername, codechefUsername } = solved
  const { easy = 0, medium = 0, hard = 0 } = difficult

  const platforms = [
    {
      name: "LeetCode",
      icon: SiLeetcode,
      value: leetcode,
      username: leetcodeUsername,
      url: `https://leetcode.com/u/${leetcodeUsername || ""}`,
      color: "text-orange-500",
      iconBg: "bg-orange-100",
      tileBg: "bg-orange-50",
    },
    {
      name: "Codeforces",
      icon: SiCodeforces,
      value: codeforces,
      username: codeforcesUsername,
      url: `https://codeforces.com/profile/${codeforcesUsername || ""}`,
      color: "text-blue-600",
      iconBg: "bg-blue-100",
      tileBg: "bg-blue-50",
    },
    {
      name: "CodeChef",
      icon: SiCodechef,
      value: codechef,
      username: codechefUsername,
      url: `https://www.codechef.com/users/${codechefUsername || ""}`,
      color: "text-purple-600",
      iconBg: "bg-purple-100",
      tileBg: "bg-purple-50",
    },
  ]

  const difficultyData = [
    { name: "Easy", value: easy, color: "#86EFAC" },     // light green
    { name: "Medium", value: medium, color: "#FCD34D" },  // light amber
    { name: "Hard", value: hard, color: "#FCA5A5" },      // light red
  ]

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Problems Solved</h2>
          <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {total}
          </p>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {platforms.map((platform) => {
          const IconComponent = platform.icon
          return (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noreferrer"
              className={`group relative overflow-hidden rounded-xl p-4 ${platform.tileBg} border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:scale-105 hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${platform.iconBg} ${platform.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{platform.name}</p>
                    <p className="text-xs text-gray-500">@{platform.username || "username"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-1xl font-bold text-gray-900 ml-1">{platform.value}</p>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors ml-auto" />
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {/* Difficulty Bars */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Difficulty Distribution</h3>
        {difficultyData.map(({ name, value, color }) => (
          <div key={name} className="group relative">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">{name}</span>
              <span className="text-sm font-bold text-gray-900">{value}</span>
            </div>
            <div className="relative w-full bg-gray-100 rounded-full h-4 overflow-visible">
              <div
                className="h-full rounded-full transition-all duration-500 cursor-pointer hover:brightness-105 relative"
                style={{
                  backgroundColor: color,
                  width: total > 0 ? `${(value / total) * 100}%` : "0%",
                }}
              >
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg pointer-events-none">
                  {value} problems ({total > 0 ? Math.round((value / total) * 100) : 0}%)
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
