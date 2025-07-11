// frontend/src/components/ProfileDetails/ActivityHeatmap.jsx
import React from "react"
import { useState } from "react"
import CalendarHeatmap from "react-calendar-heatmap"
import { motion } from "framer-motion"
import { Tooltip } from "react-tooltip"
import { Calendar, Activity } from "lucide-react"

export default function ActivityHeatmap({ data }) {
  const [tooltipContent, setTooltipContent] = useState("")
  const [hoveredValue, setHoveredValue] = useState(null)

  const allDates = data.map((d) => new Date(d.date.replaceAll("/", "-")))
  const today = new Date(Math.max(...allDates.map((d) => d.getTime())))
  const startDate = new Date(today)
  startDate.setFullYear(today.getFullYear() - 1)

  const dataMap = {}
  data.forEach(({ date, count }) => {
    const parsed = new Date(date.replaceAll("/", "-"))
    const yyyy = parsed.getFullYear()
    const mm = String(parsed.getMonth() + 1).padStart(2, "0")
    const dd = String(parsed.getDate()).padStart(2, "0")
    const key = `${yyyy}-${mm}-${dd}`
    dataMap[key] = count
  })

  const paddedData = []
  const cursor = new Date(startDate)
  while (cursor <= today) {
    const yyyy = cursor.getFullYear()
    const mm = String(cursor.getMonth() + 1).padStart(2, "0")
    const dd = String(cursor.getDate()).padStart(2, "0")
    const key = `${yyyy}-${mm}-${dd}`
    const isFirstOfMonth = dd === "01"
    paddedData.push({ date: key, count: dataMap[key] || 0, isFirstOfMonth })
    cursor.setDate(cursor.getDate() + 1)
  }

  // Calculate stats
  const totalSubmissions = paddedData.reduce((sum, day) => sum + day.count, 0)
  const activeDays = paddedData.filter((day) => day.count > 0).length
  const maxStreak = calculateMaxStreak(paddedData)
  const currentStreak = calculateCurrentStreak(paddedData)

  const classForValue = (value) => {
    const base =
      !value || value.count === 0
        ? "color-empty"
        : value.count >= 10
          ? "color-scale-4"
          : value.count >= 5
            ? "color-scale-3"
            : value.count >= 2
              ? "color-scale-2"
              : "color-scale-1"
    return value?.isFirstOfMonth ? `${base} first-of-month` : base
  }

  return (
    <>
      <style jsx>{`
        .react-calendar-heatmap {
          font-family: inherit;
        }
        
        .react-calendar-heatmap .react-calendar-heatmap-month-label {
          font-size: 12px;
          fill: #6b7280;
          font-weight: 500;
        }
        
        .dark .react-calendar-heatmap .react-calendar-heatmap-month-label {
          fill: #9ca3af;
        }
        
        .react-calendar-heatmap .react-calendar-heatmap-weekday-label {
          font-size: 10px;
          fill: #9ca3af;
          font-weight: 400;
        }
        
        .react-calendar-heatmap rect {
          rx: 3;
          ry: 3;
          stroke: rgba(255, 255, 255, 0.1);
          stroke-width: 1;
          transition: all 0.2s ease;
        }
        
        .react-calendar-heatmap rect:hover {
          stroke: #3b82f6;
          stroke-width: 2;
          transform: scale(1.1);
        }
        
        .react-calendar-heatmap .color-empty {
          fill: #f1f5f9;
        }
        
        .dark .react-calendar-heatmap .color-empty {
          fill: #1e293b;
        }
        
        .react-calendar-heatmap .color-scale-1 {
          fill: #dcfce7;
        }
        
        .dark .react-calendar-heatmap .color-scale-1 {
          fill: #166534;
        }
        
        .react-calendar-heatmap .color-scale-2 {
          fill: #bbf7d0;
        }
        
        .dark .react-calendar-heatmap .color-scale-2 {
          fill: #15803d;
        }
        
        .react-calendar-heatmap .color-scale-3 {
          fill: #86efac;
        }
        
        .dark .react-calendar-heatmap .color-scale-3 {
          fill: #16a34a;
        }
        
        .react-calendar-heatmap .color-scale-4 {
          fill: #22c55e;
        }
        
        .dark .react-calendar-heatmap .color-scale-4 {
          fill: #22c55e;
        }
        
        .react-calendar-heatmap .first-of-month {
          stroke: #e5e7eb !important;
          stroke-width: 2;
        }
        
        .dark .react-calendar-heatmap .first-of-month {
          stroke: #374151 !important;
        }
      `}</style>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:gray-800">Activity Heatmap</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {startDate.getFullYear()}–{today.getFullYear()}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg text-gray-800">{activeDays}</p>
              <p className="text-gray-500 dark:text-gray-400">Active Days</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-red-600">{maxStreak}</p>
              <p className="text-gray-500 dark:text-gray-400">Max Streak</p>
            </div>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="sm:hidden grid grid-cols-4 gap-4 mb-6">
          
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="font-bold text-green-600">{activeDays}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="font-bold text-blue-600">{maxStreak}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Max</p>
          </div>
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="min-w-[800px]"
          >
            <CalendarHeatmap
              startDate={startDate}
              endDate={today}
              values={paddedData}
              classForValue={classForValue}
              showWeekdayLabels={true}
              showMonthLabels={true}
              tooltipDataAttrs={(value) => {
                const count = value.count || 0
                const submissions = `${count} submission${count === 1 ? "" : "s"}`
                const date = new Date(value.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
                const content = `${date} — ${submissions}`
                return {
                  "data-tooltip-id": "heatmap-tooltip",
                  "data-tooltip-content": content,
                }
              }}
              onMouseOver={(event, value) => setHoveredValue(value)}
              onMouseLeave={() => {
                setTooltipContent("")
                setHoveredValue(null)
              }}
            />
          </motion.div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Less</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-white"></div>        {/* 0 */}
              <div className="w-3 h-3 rounded-sm bg-green-500"></div>        {/* light green */}
              <div className="w-3 h-3 rounded-sm bg-green-800"></div>        {/* mid green */}
              <div className="w-3 h-3 rounded-sm bg-green-900"></div>        {/* deeper */}
              <div className="w-3 h-3 rounded-sm bg-green"></div>        {/* saturated */}
            </div>
            <span>More</span>
          </div>

          {hoveredValue && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              {hoveredValue.count} submissions on {new Date(hoveredValue.date).toLocaleDateString()}
            </motion.div>
          )}
        </div>

        <Tooltip
          id="heatmap-tooltip"
          place="top"
          style={{
            backgroundColor: "#1f2937",
            color: "#f9fafb",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: "500",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        />
      </div>
    </>
  )
}

// Helper functions
function calculateMaxStreak(data) {
  let maxStreak = 0
  let currentStreak = 0

  for (const day of data) {
    if (day.count > 0) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  return maxStreak
}

function calculateCurrentStreak(data) {
  let streak = 0

  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].count > 0) {
      streak++
    } else {
      break
    }
  }

  return streak
}
