"use client"
import React from "react"
"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, ExternalLink, Trophy, Zap, Timer } from "lucide-react"

const UpcomingContests = ({ platform, apiUrl }) => {
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const res = await fetch(apiUrl)
        const data = await res.json()
        let formatted = []

        if (platform === "Codeforces" && data.status === "OK") {
          formatted = data.result
            .filter((contest) => contest.phase === "BEFORE")
            .map((contest) => ({
              title: contest.name,
              startTime: new Date(contest.startTimeSeconds * 1000).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              duration: `${contest.durationSeconds / 60} mins`,
              link: `https://codeforces.com/contest/${contest.id}`,
            }))
        } else if (Array.isArray(data)) {
          formatted = data
        } else if (data.success && Array.isArray(data.data)) {
          formatted = data.data
        }

        if (platform === "LeetCode") {
          formatted = formatted.map((contest) => ({
            title: contest.title,
            duration: `${contest.durationMinutes || "TBD"} mins`,
            startTime: contest.startDate || "TBD",
            link: `https://leetcode.com/contest/${contest.title.toLowerCase().replace(/\s+/g, "-")}`,
          }))
        }

        setContests(formatted)
      } catch (error) {
        console.error(`Failed to fetch ${platform} contests:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchContests()
  }, [apiUrl, platform])

  const getPlatformIcon = () => {
    switch (platform) {
      case "Codeforces":
        return (
          <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            CF
          </div>
        )
      case "LeetCode":
        return (
          <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            LC
          </div>
        )
      case "CodeChef":
        return (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            CC
          </div>
        )
      default:
        return <Trophy className="w-6 h-6 text-teal-500" />
    }
  }

  const getPlatformColor = () => {
    switch (platform) {
      case "Codeforces":
        return "from-teal-500 to-teal-600"
      case "LeetCode":
        return "from-cyan-500 to-cyan-600"
      case "CodeChef":
        return "from-blue-500 to-blue-600"
      default:
        return "from-teal-500 to-cyan-600"
    }
  }

  const getTimeUntilContest = (startTime) => {
    if (startTime === "TBD") return "TBD"

    const now = new Date()
    const contestTime = new Date(startTime)
    const diff = contestTime - now

    if (diff <= 0) return "Started"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-300 rounded-xl"></div>
            <div className="h-6 bg-gray-300 rounded w-48"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${getPlatformColor()} shadow-lg`}>{getPlatformIcon()}</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Upcoming {platform} Contests</h2>
            <p className="text-gray-500 text-sm">
              {contests.length} contest{contests.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">IST Timezone</span>
        </div>
      </div>

      {/* Contests */}
      {contests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Contests</h3>
          <p className="text-gray-500">Check back later for new contests!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead className={`bg-gradient-to-r ${getPlatformColor()} text-white`}>
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Contest</th>
                  <th className="px-6 py-4 text-left font-semibold">Start Time</th>
                  <th className="px-6 py-4 text-left font-semibold">Duration</th>
                  <th className="px-6 py-4 text-left font-semibold">Starts In</th>
                  <th className="px-6 py-4 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contests.map((contest, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{contest.title || contest.contestName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {contest.startTime || contest.startDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Timer className="w-4 h-4" />
                        {contest.duration && contest.duration !== "TBD"
                          ? contest.duration
                          : contest.durationMinutes
                            ? `${contest.durationMinutes} mins`
                            : "TBD"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <Zap className="w-3 h-3" />
                        {getTimeUntilContest(contest.startTime || contest.startDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {contest.link || contest.url ? (
                        <a
                          href={contest.link || contest.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${getPlatformColor()} text-white rounded-lg transition-all duration-200 hover:shadow-lg text-sm font-medium`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Join Contest
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {contests.map((contest, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {contest.title || contest.contestName}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 ml-2 flex-shrink-0">
                    <Zap className="w-3 h-3" />
                    {getTimeUntilContest(contest.startTime || contest.startDate)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{contest.startTime || contest.startDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Timer className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {contest.duration && contest.duration !== "TBD"
                        ? contest.duration
                        : contest.durationMinutes
                          ? `${contest.durationMinutes} mins`
                          : "TBD"}
                    </span>
                  </div>
                </div>

                {contest.link || contest.url ? (
                  <a
                    href={contest.link || contest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${getPlatformColor()} text-white rounded-lg transition-all duration-200 hover:shadow-lg text-sm font-medium w-full justify-center`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Join Contest
                  </a>
                ) : (
                  <div className="text-center py-2 text-gray-400 text-sm">Link not available</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UpcomingContests
