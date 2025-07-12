// File: backend/routes/allplatform.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { graphqlQuery, getProblemTags } = require('../utils/leetcode-scraper');
const { fetchAcceptedSubmissions } = require('../utils/fetchAcceptedSubmissions');
const { getUserInfo, getContestHistory} = require('../utils/codeforce-scraper');
const { getUserData } = require('../utils/codechefScraper');
const User=require("../models/login")

// LeetCode Queries
const leetProfileQuery = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile { realName ranking starRating }
      submitStats { acSubmissionNum { difficulty count } }
      tagProblemCounts {
        advanced { tagName problemsSolved }
        intermediate { tagName problemsSolved }
        fundamental { tagName problemsSolved }
      }
    }
  }`;

const leetContestQuery = `
  query userContestRankingInfo($username: String!) {
    userContestRankingHistory(username: $username) {
      attended rating ranking contest { title startTime }
    }
  }`;
  

const leetSubmissionQuery = `
  query recentSubmissions($username: String!) {
    recentSubmissionList(username: $username) {
      title titleSlug statusDisplay lang
    }
  }`;
const leetCalendarQuery = `
  query userCalendar($username: String!) {
    matchedUser(username: $username) {
      userCalendar {
        activeYears
        streak
        totalActiveDays
        submissionCalendar
      }
    }
  }
`;


router.get('/:platform/:username', async (req, res) => {
  const { platform, username } = req.params;

  try {
    if (platform === 'leetcode') {
    const [profileRes, contestRes, submissionRes, solvedProblems, calendarRes] = await Promise.all([
      graphqlQuery(leetProfileQuery, { username }),
      graphqlQuery(leetContestQuery, { username }),
      graphqlQuery(leetSubmissionQuery, { username }),
      fetchAcceptedSubmissions(username),
      graphqlQuery(leetCalendarQuery, { username })
    ]);

    const user = profileRes.data?.matchedUser;
    const calendarRaw = calendarRes.data?.matchedUser?.userCalendar || {};
    const submissionCalendar = JSON.parse(calendarRaw.submissionCalendar || '{}');

    const calendarFormatted = Object.entries(submissionCalendar).map(([ts, count]) => ({
      date: new Date(Number(ts) * 1000).toISOString().split('T')[0],
      count
    }));

    const contestsRaw = contestRes.data?.userContestRankingHistory || [];
    const submissionsRaw = submissionRes.data?.recentSubmissionList || [];

    const validContests = contestsRaw
      .filter(c => c.attended && c.ranking > 0)
      .sort((a, b) => a.contest.startTime - b.contest.startTime);

    const contests = validContests.map((c, i) => ({
      title: c.contest.title,
      startTime: new Date(c.contest.startTime * 1000).toLocaleString(),
      ratingBefore: i === 0 ? 1500 : validContests[i - 1].rating,
      ratingAfter: c.rating,
      ranking: c.ranking
    }));

    const submissions = await Promise.all(submissionsRaw.map(async (sub) => {
      try {
        const { tags, difficulty } = await getProblemTags(sub.titleSlug);
        return { ...sub, tags, difficulty };
      } catch {
        return { ...sub, tags: [], difficulty: 'Unknown' };
      }
    }));

    return res.json({
      platform: 'LeetCode',
      username: user.username,
      name: user.profile.realName,
      ranking: user.profile.ranking,
      starRating: user.profile.starRating || null,
      problemsSolved: user.submitStats.acSubmissionNum,
      skillTags: user.tagProblemCounts,
      recentSubmissions: submissions,
      contests: {
        total: contests.length,
        ratingHistory: contests
      },
      heatmap: {
        activeYears: calendarRaw.activeYears || [],
        streak: calendarRaw.streak || 0,
        totalActiveDays: calendarRaw.totalActiveDays || 0,
        data: calendarFormatted
      },
      solvedProblems
    });
  }


    if (platform === 'codeforces') {
      const [userInfo, contestHistory] = await Promise.all([
        getUserInfo(username),
        getContestHistory(username)
      ]);

      return res.json({
        platform: 'Codeforces', 
        username: userInfo.handle,
        rating: userInfo.rating,
        rank: userInfo.rank,
        maxRating: userInfo.maxRating,
        maxRank: userInfo.maxRank,
        contests: contestHistory,
        totalSolved: userInfo.totalSolved,
      });
    }

    if (platform === 'codechef') {
      const userData = await getUserData(username);
      return res.json({
        platform: 'CodeChef',
        ...userData
      });
    }

    return res.status(400).json({ error: 'Invalid platform name' });

  } catch (err) {
    console.error(`${platform} error:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});


// POST /all/combined
router.post('/combined', async (req, res) => {
  const { leetcodeUsername, codeforcesUsername, codechefUsername,userId } = req.body;

  try {
    const [leetcodeRes, codeforcesRes, codechefRes] = await Promise.all([
      axios.get(`http://localhost:3000/all/leetcode/${leetcodeUsername}`),
      axios.get(`http://localhost:3000/all/codeforces/${codeforcesUsername}`),
      axios.get(`http://localhost:3000/all/codechef/${codechefUsername}`)
    ]);
    const combinedData = {
      leetcode: leetcodeRes.data,
      codeforces: codeforcesRes.data,
      codechef: codechefRes.data
    };
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        leetcodeUsername,
        codeforcesUsername,
        codechefUsername,
        platformDetails: combinedData
      });
    }
    return res.json({
      success: true,
      ...combinedData
    });
  } catch (error) {
    console.error('Fetch platform error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});




module.exports = router;
