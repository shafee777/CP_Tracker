// File: backend/routes/allplatform.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { graphqlQuery, getProblemTags } = require('../utils/leetcode-scraper');
const { fetchAcceptedSubmissions } = require('../utils/fetchAcceptedSubmissions');
const { getUserInfo, getContestHistory} = require('../utils/codeforce-scraper');
const { getUserData } = require('../utils/codechefScraper');
const User=require("../models/login")

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const asNumber = (value, fieldName) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`Invalid ${fieldName} in platform response`);
  }
  return number;
};

const normalizePlatformData = (platform, data) => {
  const platformNames = {
    leetcode: 'LeetCode',
    codeforces: 'Codeforces',
    codechef: 'CodeChef'
  };
  if (!isRecord(data) || data.platform !== platformNames[platform]) {
    throw new Error(`Invalid ${platform} response`);
  }
  if (typeof data.username !== 'string' || !data.username.trim()) {
    throw new Error(`Missing ${platform} username in response`);
  }

  if (platform === 'leetcode') {
    if (!Array.isArray(data.problemsSolved) || !isRecord(data.contests) || !isRecord(data.heatmap)) {
      throw new Error('Invalid LeetCode profile structure');
    }
    return {
      ...data,
      username: data.username.trim(),
      ranking: data.ranking == null ? null : asNumber(data.ranking, 'ranking'),
      starRating: data.starRating == null ? null : asNumber(data.starRating, 'star rating'),
      problemsSolved: data.problemsSolved.map(problem => {
        if (!isRecord(problem) || typeof problem.difficulty !== 'string') {
          throw new Error('Invalid LeetCode problem statistics');
        }
        return { ...problem, count: asNumber(problem.count, 'problem count') };
      }),
      recentSubmissions: Array.isArray(data.recentSubmissions) ? data.recentSubmissions : [],
      contests: {
        ...data.contests,
        total: asNumber(data.contests.total, 'contest count'),
        ratingHistory: Array.isArray(data.contests.ratingHistory) ? data.contests.ratingHistory : []
      },
      heatmap: {
        ...data.heatmap,
        data: Array.isArray(data.heatmap.data) ? data.heatmap.data : []
      },
      solvedProblems: isRecord(data.solvedProblems) ? data.solvedProblems : {}
    };
  }

  if (platform === 'codeforces') {
    if (!isRecord(data.contests)) throw new Error('Invalid Codeforces contest history');
    return {
      ...data,
      username: data.username.trim(),
      rating: data.rating == null ? 0 : asNumber(data.rating, 'rating'),
      maxRating: data.maxRating == null ? 0 : asNumber(data.maxRating, 'maximum rating'),
      totalSolved: asNumber(data.totalSolved, 'solved count'),
      contests: {
        ...data.contests,
        totalContests: asNumber(data.contests.totalContests, 'contest count'),
        contests: Array.isArray(data.contests.contests) ? data.contests.contests : []
      }
    };
  }

  if (!Array.isArray(data.ratingHistory)) throw new Error('Invalid CodeChef rating history');
  return {
    ...data,
    username: data.username.trim(),
    rating: asNumber(data.rating || 0, 'rating'),
    totalSolved: asNumber(data.totalSolved || 0, 'solved count'),
    totalContests: asNumber(data.totalContests || 0, 'contest count'),
    ratingHistory: data.ratingHistory
  };
};

const fetchPlatformWithRetry = async (platform, url, maxAttempts = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await axios.get(url, { timeout: 20000 });
      return { data: normalizePlatformData(platform, response.data), attempts: attempt };
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500 * (2 ** (attempt - 1))));
      }
    }
  }

  throw Object.assign(new Error(lastError.message), { attempts: maxAttempts });
};

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
    ])

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
      }
      catch {
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
        username: userInfo.username || userInfo.handle || username,
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
    const platformRequests = {
      leetcode: `http://localhost:3000/all/leetcode/${encodeURIComponent(leetcodeUsername || '')}`,
      codeforces: `http://localhost:3000/all/codeforces/${encodeURIComponent(codeforcesUsername || '')}`,
      codechef: `http://localhost:3000/all/codechef/${encodeURIComponent(codechefUsername || '')}`
    };
    const settledRequests = await Promise.allSettled(
      Object.entries(platformRequests).map(([platform, url]) => fetchPlatformWithRetry(platform, url))
    );

    const existingUser = userId
      ? await User.findById(userId).select('platformDetails')
      : null;
    const platformData = {};
    const platformStatus = {};
    settledRequests.forEach((result, index) => {
      const platform = Object.keys(platformRequests)[index];
      if (result.status === 'fulfilled') {
        platformData[platform] = result.value.data;
        platformStatus[platform] = {
          status: 'success',
          attempts: result.value.attempts
        };
      } else {
        const lastKnownData = existingUser?.platformDetails?.[platform];
        platformData[platform] = lastKnownData || null;
        platformStatus[platform] = {
          status: lastKnownData ? 'stale' : 'failed',
          attempts: result.reason.attempts || 3,
          error: result.reason.message
        };
        console.error(`${platform} fetch failed after ${platformStatus[platform].attempts} attempts:`, result.reason.message);
      }
    });

    const combinedData = { ...platformData, platformStatus };
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
      ...combinedData,
      partial: Object.values(platformStatus).some(({ status }) => status !== 'success')
    });
  } catch (error) {
    console.error('Fetch platform error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});




module.exports = router;
