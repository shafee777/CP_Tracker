//backend/utils/leetcode-scraper.js
const axios = require('axios');
const BASE_URL = 'https://leetcode.com/graphql/';

const graphqlQuery = async (query, variables) => {
    try {
        const response = await axios.post(
            BASE_URL,
            { query, variables },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Referer': 'https://leetcode.com/',
                    'Origin': 'https://leetcode.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                }

            }
        );

        if (response.data.errors) {
            const errorMessage = response.data.errors[0].message || 'Unknown GraphQL error';
            console.error('GraphQL Error:', errorMessage);
            throw new Error(errorMessage);
        }

        return response.data;

    } catch (error) {
        console.error('GraphQL request failed:', error.message);
        throw new Error('Failed to fetch data from LeetCode');
    }
};

const getProblemTags = async (titleSlug) => {
    const query = `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          title
          difficulty
          topicTags {
            name
          }
        }
      }
    `;

    const variables = { titleSlug };

    const data = await graphqlQuery(query, variables);
    const question = data?.data?.question;
    return{
        difficulty: question?.difficulty || "Unknown",
        tags: question?.topicTags?.map(tag => tag.name) || []
    };
};

module.exports = {
    graphqlQuery,
    getProblemTags
};
