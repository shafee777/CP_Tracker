//backend/routes/codechef.js
const express = require('express');
const router = express.Router();
const { getUpcomingContests ,getUserData} = require('../utils/codechefScraper');
const axios = require('axios');

// Get user details by username
router.get('/:username', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await getUserData(username);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get upcoming CodeChef contests
router.get('/upcoming/contests', async (req, res) => {
  const contests = await getUpcomingContests();
  if (contests.length === 0) {
    return res.status(500).json({ error: 'Failed to fetch upcoming contests' });
  }
  res.json(contests);
});





module.exports = router;
