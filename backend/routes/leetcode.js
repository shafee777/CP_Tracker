//backend/routes/leetcode.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { graphqlQuery } = require('../utils/leetcode-scraper');
const { getProblemTags } = require('../utils/leetcode-scraper');
const { fetchAcceptedSubmissions } = require('../utils/fetchAcceptedSubmissions');
const cache = {};


// GET /user/:username ===> User Profile
router.get('/:username', async (req, res) => {
  const username = req.params.username;
  const key = `user_${username}`;

  if (cache[key]) {
    return res.json(cache[key]);
  }

  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          ranking
          starRating
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }`;

  try {
    const result = await graphqlQuery(query, { username });
    const user = result.data.matchedUser;

    if (!user) throw new Error('User not found');

    const response = {
      username: user.username,
      name: user.profile.realName,
      ranking: user.profile.ranking,
      starRating: user.profile.starRating || null,
      problemsSolved: user.submitStats.acSubmissionNum
    };
    cache[key] = response;
    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



// GET /user/:username/contests=>>>Contest Details
router.get('/:username/contests', async (req, res) => {
  const username = req.params.username;
  const key = `contest_${username}`;

  if (cache[key]) {
    return res.json(cache[key]);
  }

  const query = `
    query userContestRankingInfo($username: String!) {
      userContestRankingHistory(username: $username) {
        attended
        rating
        ranking
        contest {
          title
          startTime
        }
      }
    }
  `;

  try {
    const result = await graphqlQuery(query, { username });
    const history = result.data.userContestRankingHistory;

    if (!history || history.length === 0) {
      throw new Error('No contest history found');
    }
    const attendedContests = history.filter(c => c.attended);
    const validContests = history.filter(c => c.attended && c.ranking > 0);
    validContests.sort((a, b) => a.contest.startTime - b.contest.startTime);

    const initialRating = 1500;
    const contests = validContests.map((contest, i) => {
      return {
        title: contest.contest.title,
        startTime: new Date(contest.contest.startTime * 1000).toLocaleString(),
        ratingBefore: i === 0 ? initialRating : validContests[i - 1].rating,
        ratingAfter: contest.rating,
        ranking: contest.ranking
        
      };
    });
    const output = {
      username,
      totalContests: contests.length,
      ratingHistory: contests
    };

    cache[key] = output;
    res.json(output);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// GET /user/:username/Resubmissions===>>>Recent Submissioon
router.get('/:username/submissions', async (req, res) => {
  const username = req.params.username;
  const key = `subs_${username}`;

  if (cache[key]) {
    return res.json(cache[key]);
  }

  const query = `
    query recentSubmissions($username: String!) {
      recentSubmissionList(username: $username) {
        titleSlug
        title
        statusDisplay
        lang
      }
    }
  `;

  try {
    const result = await graphqlQuery(query, { username });
    console.log("LeetCode raw result for submissions:", JSON.stringify(result, null, 2));
    const submissions = result.data.recentSubmissionList;

    if (!submissions) throw new Error('Submissions not found');

    cache[key] = submissions;
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Problem Tags:
router.get('/problem-tags/:slug', async (req, res) => {
      const titleSlug = req.params.slug;

      try{
          const tags = await getProblemTags(titleSlug);
          res.json({ titleSlug, tags });
      }
      catch (error) {
          console.error(error);
          res.status(500).json({ error: error.message });
      }
  });



//Combine Recent sub and tags
router.get('/:username/submissions-with-tags', async (req, res) => {
  const username = req.params.username;

  const submissionsQuery = `
    query recentSubmissions($username: String!) {
      recentSubmissionList(username: $username) {
        title
        titleSlug
        statusDisplay
        lang
      }
    }
  `;

  try {
    const subsResult = await graphqlQuery(submissionsQuery, { username });
    const submissions = subsResult.data?.recentSubmissionList;

    if (!submissions) throw new Error("No submissions found");

    const toSlug = title => title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');

    const submissionsWithTags = await Promise.all(submissions.map(async (sub) => {
      try {
        const { tags, difficulty } = await getProblemTags(sub.titleSlug);
        return { ...sub, tags, difficulty };
      }
      catch (err) {
        console.warn(`Failed to get tags for: ${sub.titleSlug}`, err.message);
        return { ...sub, tags: [], difficulty: "Unknown" };
      }
    }));
    res.json(submissionsWithTags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



//Tot Tag wise solved
router.get('/:username/skills', async (req, res) => {
  const username = req.params.username;
  const key = `skills_${username}`;

  if (cache[key]) {
    return res.json(cache[key]);
  }

  const query = `
    query skillStats($username: String!) {
      matchedUser(username: $username) {
        tagProblemCounts {
          advanced {
            tagName
            problemsSolved
          }
          intermediate {
            tagName
            problemsSolved
          }
          fundamental {
            tagName
            problemsSolved
          }
        }
      }
    }
  `;

  try {
    const result = await graphqlQuery(query, { username });
    const tagsData = result.data?.matchedUser?.tagProblemCounts;

    if (!tagsData) {
      throw new Error("Skill stats not found for the user");
    }

    cache[key] = tagsData;
    res.json(tagsData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});



//Fetch all data for a user including profile, contests, submissions, and skills
router.get('/:username/fetch-all', async (req, res) => {
    const username = req.params.username;

    const profileQuery = `
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

    const contestQuery = `
      query userContestRankingInfo($username: String!) {
        userContestRankingHistory(username: $username) {
          attended rating ranking contest { title startTime }
        }
      }`;

    const submissionQuery = `
      query recentSubmissions($username: String!) {
        recentSubmissionList(username: $username) {
          title titleSlug statusDisplay lang
        }
      }`;

    try {
      const [profileRes, contestRes, submissionRes, solvedProblems] = await Promise.all([
        graphqlQuery(profileQuery, { username }),
        graphqlQuery(contestQuery, { username }),
        graphqlQuery(submissionQuery, { username }),
        fetchAcceptedSubmissions(username),
      ]);

      const user = profileRes.data?.matchedUser;
      const contestsRaw = contestRes.data?.userContestRankingHistory || [];
      const submissionsRaw = submissionRes.data?.recentSubmissionList || [];

      const validContests = contestsRaw.filter(c => c.attended && c.ranking > 0).sort((a, b) => a.contest.startTime - b.contest.startTime);
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

      const response = {
        username: user.username,
        name: user.profile.realName,
        ranking: user.profile.ranking,
        starRating: user.profile.starRating || null,
        problemsSolved: user.submitStats.acSubmissionNum,
        skillTags: user.tagProblemCounts,
        recentSubmissions: submissions,
        contests: {
          total: contests.length,
          ratingHistory: contests.slice(-10)
        },
        solved_problems: solvedProblems,
      };
      
      // const updatedUser = await newUserData.findOneAndUpdate(
      //   { username: response.username },
      //   { $set: response },
      //   { upsert: true, new: true, setDefaultsOnInsert: true }
      // );

      console.log("User upserted:", response);

      res.json(response);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});



router.get("/:username/predict/:contest", async (req, res) => {
  const { username, contest } = req.params;

  try {
    const response = await axios.get(
      "https://lccn.lbao.site/api/v1/contest-records/user",
      {
        params: {
          username,
          contest_name: contest,
          archived: false
        },
      }
    );

    const records = response.data;

    if (!records || records.length === 0) {
      return res.status(404).json({ message: "No contest data found." });
    }

    const record = records[0]; // First contest record

    const contestName = record.contest_name;
    const rank = record.rank;
    const date = new Date(record.finish_time).toLocaleString();
    const delta = Math.round(record.delta_rating * 100) / 100;
    const rating = Math.round(record.new_rating * 100) / 100;
    const old_rating = Math.round(record.old_rating * 100) / 100;
    const score = record.score;

    res.json({
      contestName,
      date,
      rank,
      score,
      delta,
      old_rating,
      rating
    });

  } catch (err) {
    console.error("Predict route error:", err.message);
    res.status(500).json({ error: "Failed to fetch contest data." });
  }
});



module.exports = router;