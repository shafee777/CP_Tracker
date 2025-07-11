const axios = require("axios");


const getUserInfo = async (username) => {
  const profileRes = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`);
  const profile = profileRes.data.result[0];

  const submissionsRes = await axios.get(`https://codeforces.com/api/user.status?handle=${username}`);
  const submissions = submissionsRes.data.result;

  const solvedSet = new Set();
  for (let sub of submissions) {
    if (sub.verdict === 'OK') {
      const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
      solvedSet.add(problemKey);
    }
  }

  return {
    username: profile.handle,
    rank: profile.rank || "Unrated",
    rating: profile.rating || 0,
    maxRating: profile.maxRating || 0,
    contribution: profile.contribution || 0,
    totalSolved: solvedSet.size,
    solvedProblems: Array.from(solvedSet) 
  };
};

// Contest History
const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(); 
};

const getContestHistory = async (username) => {
  const { data } = await axios.get(`https://codeforces.com/api/user.rating?handle=${username}`);
  const contests = data.result.map(contest => ({
    contestName: contest.contestName,
    rank: contest.rank,
    oldRating: contest.oldRating,
    newRating: contest.newRating,
    ratingChange: contest.newRating - contest.oldRating,
    date: formatDate(contest.ratingUpdateTimeSeconds)
  }));
  return {
    totalContests: contests.length,
    contests: contests.slice(-5).reverse()
  };
};

// Upcoming Contests
const getUpcomingContests = async () => {
  try {
    const response = await axios.get('https://codeforces.com/api/contest.list');
    
    if (response.data.status !== 'OK') {
      throw new Error('Codeforces API did not return OK status');
    }

    const contests = response.data.result;
    const upcoming = contests
      .filter(contest => contest.phase === 'BEFORE')
      .slice(0, 5)
      .map(contest => {
        const startTime = new Date(contest.startTimeSeconds * 1000).toLocaleString();
        const duration = `${Math.floor(contest.durationSeconds / 3600)} hrs ${Math.floor((contest.durationSeconds % 3600) / 60)} mins`;

        return {
          contestId: contest.id,
          contestName: contest.name,
          duration: duration,
          startTime: startTime,
          url: `https://codeforces.com/contests/${contest.id}`
        };
      });

    return upcoming;

  } catch (error) {
    console.error("Error in getUpcomingContests():", error.message);
    throw new Error("Failed to fetch upcoming contests from Codeforces");
  }
};




module.exports = {
  getUserInfo,
  getContestHistory,
  getUpcomingContests
};
