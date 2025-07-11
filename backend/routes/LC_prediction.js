// backend/routes/LC_prediction.js(for predicting LeetCode contest ratings)

const express = require("express");
const axios = require("axios");
const router = express.Router();

// Predict rating using LCCN public API
router.get("/:username/predict/:contest", async (req, res) => {
  console.log("Received request with params:", req.params);
  const { username, contest } = req.params;

  const apiUrl = `https://lccn.lbao.site/api/v1/contest-records/user`;
  const params = {
    contest_name: contest,
    username: username,
    archived: false
  };

  try {
    const { data } = await axios.get(apiUrl, { params });

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No contest record found." });
    }

    const record = data[0];

    res.json({
    contestName: record.contest_name,
    date: record.finish_time
      ? new Date(record.finish_time).toLocaleString()
      : "Not Available",
    rating: Math.round(record.old_rating) ?? "Not Available",
    rank: record.rank ?? "Not Available",
    predictedRating: Math.round(record.new_rating) ?? "Not Available",
    delta: record.delta_rating != null
      ? Math.round(record.delta_rating)
      : "Not Available",
    problemsSolved: record.score ?? "Not Available",
    attendedContests: record.attendedContestsCount ?? "Not Available",
    country: record.country_name ?? "Unknown"
    });


  } catch (error) {
    console.error("LCCN API error:", error.message);
    res.status(500).json({ error: "Failed to fetch prediction from LCCN." });
  }
});

module.exports = router;
