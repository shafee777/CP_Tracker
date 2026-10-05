// backend/routes/recommend.js
const express = require("express");
const { spawn } = require("child_process");
const NodeCache = require("node-cache");
const router = express.Router();

// Fixed 5-minute TTL cache (stdTTL: 300 seconds from insertion, fixed - not sliding)
const recomCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Invalidate cached recommendations for one or more user identifiers
 * (e.g. CPAI username, LeetCode username).
 */
function invalidateUserCache(...identifiers) {
  let cleared = 0;
  identifiers.forEach((id) => {
    if (id && typeof id === "string") {
      const key = `recom_${id.trim().toLowerCase()}`;
      if (recomCache.has(key)) {
        recomCache.del(key);
        cleared++;
      }
    }
  });
  return cleared;
}

router.get("/:username", (req, res) => {
  const username = req.params.username;
  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Username parameter is required" });
  }

  const cacheKey = `recom_${username.trim().toLowerCase()}`;

  // Cache clearing / bypass strictly limited to non-production/test environments
  const isTestOrDev = process.env.NODE_ENV !== "production";
  const bypassCache = isTestOrDev && (req.headers["x-test-bypass-cache"] === "true" || req.query.nocache === "true");
  const clearCache = isTestOrDev && req.headers["x-test-clear-cache"] === "true";

  if (clearCache) {
    recomCache.del(cacheKey);
  }

  if (!bypassCache) {
    const cached = recomCache.get(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }
  }

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
      // Compatibility shim: populate 'recommended' array for frontend Recom_model.jsx
      if (!parsed.recommended && parsed.recommendations_by_tag) {
        parsed.recommended = Object.values(parsed.recommendations_by_tag).flat();
      }
      if (!bypassCache) {
        recomCache.set(cacheKey, parsed);
      }
      res.setHeader("X-Cache", "MISS");
      return res.json(parsed);
    } catch (e) {
      return res.status(500).json({ error: "Invalid JSON from Python", raw: data });
    }
  });
});

module.exports = router;
module.exports.invalidateUserCache = invalidateUserCache;
module.exports.recomCache = recomCache;

