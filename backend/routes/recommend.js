// backend/routes/recommend.js
const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();

router.get("/:username", (req, res) => {
  const username = req.params.username;
  const py = spawn("python", ["ml.py", username]);

  let data = "";
  let error = "";

  py.stdout.on("data", (chunk) => {
    data += chunk.toString();
  });

  py.stderr.on("data", (chunk) => {
    error += chunk.toString();
  });

  py.on("close", (code) => {
    if (code !== 0 || error) {
      return res.status(500).json({ error: "Python script failed", detail: error });
    }

    try {
      const parsed = JSON.parse(data);
      return res.json(parsed);
    } catch (e) {
      return res.status(500).json({ error: "Invalid JSON from Python", raw: data });
    }
  });
});

module.exports = router;
