const axios = require('axios');
require('dotenv').config();

class GitHubClient {
  constructor() {
    const token = process.env.GITHUB_TOKEN;
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        ...(token && { Authorization: `token ${token}` }),
        Accept: 'application/vnd.github.v3+json',
      },
    });
  }

  async getUserProfile(username) {
    try {
      const response = await this.client.get(`/users/${username}`);
      return response.data;
    } catch (error) {
      console.error(`[GitHub] 프로필 조회 실패 (${username}):`, error.message);
      throw error;
    }
  }

  async getUserContributionStats(username) {
    try {
      const commitRes = await this.client.get('/search/commits', {
        params: { q: `author:${username}` }
      });
      const prRes = await this.client.get('/search/issues', {
        params: { q: `author:${username} type:pr` }
      });
      return {
        totalCommits: commitRes.data.total_count,
        totalPRs: prRes.data.total_count,
      };
    } catch (error) {
      console.error(`[GitHub] 기여도 데이터 조회 실패 (${username}):`, error.message);
      return { totalCommits: 0, totalPRs: 0 };
    }
  }
}

module.exports = new GitHubClient();
