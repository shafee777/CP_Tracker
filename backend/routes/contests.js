//backend/routes/contests.js(for upcoming Leetcode contests)
const express = require('express');
const router = express.Router();
const { graphqlQuery } = require('../utils/leetcode-scraper'); 

const cache = {};

router.get('/upcoming', async (req, res) => {
  const cacheKey = 'upcoming_contests';

  if (cache[cacheKey]) {
    return res.json(cache[cacheKey]); 
  }

  const query = `
    query {
      allContests {
        title
        startTime
        duration
      }
    }
  `;

  try {
    const result = await graphqlQuery(query, {});
    const allContests = result.data.allContests;

    if (!allContests) throw new Error('No contests found');

    const nowTimestamp = Math.floor(Date.now() / 1000);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const upcoming = allContests.filter(contest =>
      !isNaN(parseInt(contest.startTime)) &&
      parseInt(contest.startTime) > nowTimestamp
    );

    const formattedUpcoming = upcoming
      .map(c => {
        const startTime = parseInt(c.startTime, 10);
        const duration = parseInt(c.duration, 10);
        const date = new Date(startTime * 1000);

        return {
          title: c.title || 'No title',
          startDate: !isNaN(date.getTime())
            ? date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            : 'Invalid Date',
          durationMinutes: !isNaN(duration) ? duration / 60 : null,
          startTimestamp: startTime,
          month: date.getMonth(),
          year: date.getFullYear(),
          link: `https://leetcode.com/contest/${c.title.toLowerCase().replace(/\s+/g, '-')}`
        };
      })
      .sort((a, b) => {
      const aMonthKey = `${a.year}-${a.month}`;
      const bMonthKey = `${b.year}-${b.month}`;
      const nowKey = `${currentYear}-${currentMonth}`;

      if (aMonthKey === nowKey && bMonthKey !== nowKey) return -1;
      if (aMonthKey !== nowKey && bMonthKey === nowKey) return 1;
      return b.startTimestamp - a.startTimestamp;
    });


    cache[cacheKey] = formattedUpcoming;
    res.json(formattedUpcoming);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
