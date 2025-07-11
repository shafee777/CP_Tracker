// backend/utils/fetchAcceptedSubmissions.js
const axios = require('axios');

// Replace with actual session values from your LeetCode cookies
LEETCODE_SESSION = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfYXV0aF91c2VyX2lkIjoiMTEyOTU0NTgiLCJfYXV0aF91c2VyX2JhY2tlbmQiOiJkamFuZ28uY29udHJpYi5hdXRoLmJhY2tlbmRzLk1vZGVsQmFja2VuZCIsIl9hdXRoX3VzZXJfaGFzaCI6ImI3ZDk0YmVkMWE2NWNjMWY4ZmEyZTlhYWU4NWM2N2RhYWI3MDdkZDhiYTAyOTg5MTlkZjEzY2RkMDljYmE3ZWYiLCJzZXNzaW9uX3V1aWQiOiIwYzMwZmIwZCIsImlkIjoxMTI5NTQ1OCwiZW1haWwiOiJtb2hhbWVkc2hhZmVlbS5haWRzMjAyM0BjaXRjaGVubmFpLm5ldCIsInVzZXJuYW1lIjoiU2hhZmVlXzc3IiwidXNlcl9zbHVnIjoiU2hhZmVlXzc3IiwiYXZhdGFyIjoiaHR0cHM6Ly9hc3NldHMubGVldGNvZGUuY29tL3VzZXJzL1NoYWZlZV83Ny9hdmF0YXJfMTc0OTYxODgyNC5wbmciLCJyZWZyZXNoZWRfYXQiOjE3NTIyNTMxMDIsImlwIjoiMjQwOTo0MGY0OjQxMGY6MTRjMToyZGVkOjc5ZWE6NmZhODphMDY2IiwiaWRlbnRpdHkiOiJkMmFkNjc4NWQyNTY4NTFkZDM2NjcwM2JkYzYxYWE2MSIsImRldmljZV93aXRoX2lwIjpbIjllZjkyZTI0YWJmNjFhOTQ3MTUzOTIwYzIxNzYwMmQ4IiwiMjQwOTo0MGY0OjQxMGY6MTRjMToyZGVkOjc5ZWE6NmZhODphMDY2Il0sIl9zZXNzaW9uX2V4cGlyeSI6MTIwOTYwMH0.Yh-QP-A8Qf23g4ysi_VbSMCWjHsQhtVQxhg_TbDOO_s"
CSRF_TOKEN = "rOpNSLub85y3YDqBzj6InjiE2He0EXhWBAZz5K8MdabWHcIZDtiWYZRvoFv3GdxO"

const headers = {
  'x-csrftoken': CSRF_TOKEN,
  'referer': 'https://leetcode.com',
  'cookie': `LEETCODE_SESSION=${LEETCODE_SESSION}; csrftoken=${CSRF_TOKEN}`,
};

async function fetchAcceptedSubmissions(username) {
  const allAcProblems = {};
  let offset = 0;
  const limit = 20;

  while (true) {
    const url = `https://leetcode.com/api/submissions/?offset=${offset}&limit=${limit}&lastkey=`;

    try {
      const res = await axios.get(url, { headers });

      const submissions = res.data.submissions_dump || [];

      if (!submissions.length) break;

      submissions.forEach(sub => {
        if (sub.status_display === 'Accepted') {
          allAcProblems[sub.title_slug] = sub.title;
        }
      });

      if (!res.data.has_next) break;

      offset += limit;
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`❌ Failed at offset ${offset}:`, err.message);
      break;
    }
  }

  return allAcProblems;
}

module.exports = { fetchAcceptedSubmissions };
