// frontend/src/components/ProfileDetails/RatingGraph.jsx
import React, { useState } from 'react';
import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid} from 'recharts';
import { SiLeetcode, SiCodeforces, SiCodechef } from 'react-icons/si';

export default function ContestPerformance({ ratingData = {}, contest = {} }) {
  const [platform, setPlatform] = useState('leetcode');
  const data = ratingData[platform] || [];

  const platformButtons = [
    {
      id: 'leetcode',
      label: `LeetCode: ${contest.leetcode}`,
      icon: <SiLeetcode className="text-yellow-500" size={18} />
    },
    {
      id: 'codeforces',
      label: `Codeforces: ${contest.codeforces}`,
      icon: <SiCodeforces className="text-blue-600" size={18} />
    },
    {
      id: 'codechef',
      label: `CodeChef: ${contest.codechef}`,
      icon: <SiCodechef className="text-purple-700" size={18} />
    }
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-md dark:bg-darkBox-900">
      {/* Heading */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-black">
          Contests Attended
        </h2>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          Total: {contest.total}
        </p>
      </div>

      {/* Contest Platform Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {platformButtons.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setPlatform(id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full font-medium border transition-all ${
              platform === id
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Rating Graph Section */}
      {data.length ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="#f2c94c" strokeDasharray="2 2" />
            <XAxis tick={false} axisLine={true} tickLine={false} />
            <YAxis
              domain={['abs(dataMin) - 100', 'abs(dataMax) + 100']}
              tick={{ fill: '#555', fontSize: 12 }}
              axisLine={true}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const { rating, date, rank } = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-300 rounded-md p-3 text-sm text-black shadow-md">
                    <p className="font-semibold mb-1">Rating: {rating}</p>
                    {rank !== undefined && <p>Rank: {rank}</p>}
                    {date && <p className="text-gray-500 text-xs">{date}</p>}
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#f2c94c"
              strokeWidth={3}
              dot={{ r: 4, stroke: '#00000088', strokeWidth: 1.5, fill: '#f2c94c' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-center mt-4">
          No rating data available for <span className="capitalize">{platform}</span>
        </p>
      )}
    </div>
  );
}
