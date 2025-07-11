// backend/routes/codeforce.js
const express = require("express");
const router = express.Router();
const axios = require('axios');
const {
  getUserInfo,
  getContestHistory,
  getUpcomingContests
} = require("../utils/codeforce-scraper");

// User info by username
router.get("/userinfo/:username", async (req, res) => {
  try {
    const userInfo = await getUserInfo(req.params.username);
    res.json({ success: true, data: userInfo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Contest history by username
router.get("/contests/:username", async (req, res) => {
  try {
    const contestHistory = await getContestHistory(req.params.username);
    res.json({ success: true, data: contestHistory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upcoming contests
router.get("/contests/upcoming", async (req, res) => {
  try {
    const contests = await getUpcomingContests();
    res.json({ success: true, data: contests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;
