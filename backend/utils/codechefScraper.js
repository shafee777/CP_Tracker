//backend/utils/codechefScraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const CODECHEF_CONTESTS_URL = 'https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all';


async function getUserData(username) {
  try {
    const response = await axios.get(`https://www.codechef.com/users/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const $ = cheerio.load(response.data);

    const rating = $('.rating-number').first().text().trim();
    const stars = $('.rating-star').first().text().trim();
    const fullyQualifiedName = $('.user-details-container header h1').text().trim() || username;
    const country = $('.user-country-name').text().trim() || 'N/A';

    let totalSolved = 0;
    $('h3').each((i, el) => {
      const text = $(el).text().trim();
      if (text.startsWith("Total Problems Solved:")) {
        const parts = text.split(":");
        if (parts.length === 2) {
          totalSolved = parseInt(parts[1].trim());
        }
      }
    });


    let ratingHistory = [];
    const scripts = $('script');

    scripts.each((i, el) => {
      const content = $(el).html();
      if (content?.includes('date_versus_rating')) {
        const match = content.match(/"date_versus_rating":({.*?}),"user_initial_ratings"/s);
        if (match && match[1]) {
          const raw = match[1];
          try {
            const parsed = JSON.parse(raw);
            const history = parsed.all;
            let prevRating = 1000;

            ratingHistory = history.map((entry, i) => {
              const newRating = parseInt(entry.rating);
              const delta = i > 0 ? newRating - parseInt(history[i - 1].rating) : newRating - 1000;
              return {
                contestName: entry.name,
                contestCode: entry.code,
                date: entry.end_date,
                rank: entry.rank,
                newRating,
                delta
              };
            });
          } catch (e) {
            console.error("Error parsing rating history:", e.message);
          }
        }
      }
    });

    return {
      username,
      name: fullyQualifiedName,
      rating,
      stars,
      country,
      totalSolved,
      ratingHistory,
      totalContests: ratingHistory.length
    };

  } catch (error) {
    console.error('Error fetching user data:', error.message);
    throw new Error('Failed to fetch user data');
  }
}


async function getUpcomingContests() {
  try {
    const { data } = await axios.get(CODECHEF_CONTESTS_URL);

    if (!data || !data.future_contests) {
      throw new Error("Invalid API response");
    }

    const contests = data.future_contests.map(contest => ({
      contestCode: contest.contest_code,
      contestName: contest.contest_name,
      startDate: contest.contest_start_date,
      endDate: contest.contest_end_date,
    }));

    return contests;
  } catch (error) {
    console.error('Error fetching from CodeChef API:', error.message);
    return [];
  }
}

module.exports = { getUpcomingContests, getUserData };

