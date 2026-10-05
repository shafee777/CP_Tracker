// backend/utils/fetchAcceptedSubmissions.js
const axios = require('axios');

// Replace with actual session values from your LeetCode cookies
LEETCODE_SESSION = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfYXV0aF91c2VyX2lkIjoiMTEyOTU0NTgiLCJfYXV0aF91c2VyX2JhY2tlbmQiOiJkamFuZ28uY29udHJpYi5hdXRoLmJhY2tlbmRzLk1vZGVsQmFja2VuZCIsIl9hdXRoX3VzZXJfaGFzaCI6IjU2OWY5YmMzM2ZmNTEwZjY1MzBjNTA1MDMwNThiMTIxMjE1ZmE5YjdhM2FkMzg0MGM1YTdmODNlMTBiNmM2ZTUiLCJzZXNzaW9uX3V1aWQiOiI0M2UyNWM5YSIsImlkIjoxMTI5NTQ1OCwiZW1haWwiOiJtb2hhbWVkc2hhZmVlbS5haWRzMjAyM0BjaXRjaGVubmFpLm5ldCIsInVzZXJuYW1lIjoiU2hhZmVlXzc3IiwidXNlcl9zbHVnIjoiU2hhZmVlXzc3IiwiYXZhdGFyIjoiaHR0cHM6Ly9hc3NldHMubGVldGNvZGUuY29tL3VzZXJzL1NoYWZlZV83Ny9hdmF0YXJfMTc0OTYxODgyNC5wbmciLCJyZWZyZXNoZWRfYXQiOjE3ODI4MTU1NTksImlwIjoiMTQuOTYuMjM0LjIyIiwiaWRlbnRpdHkiOiI5MDBiNTM0MTBkYmUwZTBjMjg0MTdhMjI2YzgxMDg2YyIsImRldmljZV93aXRoX2lwIjpbIjYyN2UxYTU1OWE4M2JhNDZhZjM1NWEzOTFiNjIzNjEyIiwiMTQuOTYuMjM0LjIyIl0sIl9zZXNzaW9uX2V4cGlyeSI6MTIwOTYwMH0.3F91GwLvyf-r2AaSXIOs07V799gStuZRP-q9iLrVsm0"
CSRF_TOKEN = "GVpz69QOHl9M6jlvyWegZNInqB9poy9A"

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
