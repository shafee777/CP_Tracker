// src/pages/ContestsPage.jsx

import React from 'react';
import UpcomingContests from './Contests';

const ContestsPage = () => {
  const platforms = [
    {
      platform: "LeetCode",
      apiUrl: "http://localhost:3000/contests/upcoming",
    },
    {
      platform: "Codeforces",
      apiUrl: "https://codeforces.com/api/contest.list",
    },
    {
      platform: "CodeChef",
      apiUrl: "http://localhost:3000/codechef/upcoming/contests",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Upcoming Contests</h1>
      {platforms.map((item, index) => (
        <UpcomingContests key={index} platform={item.platform} apiUrl={item.apiUrl} />
      ))}
    </div>
  );
};

export default ContestsPage;
