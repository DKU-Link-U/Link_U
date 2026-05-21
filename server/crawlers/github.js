const axios = require('axios');
require('dotenv').config();
const {
  addDaysToDateKey,
  dateKeyToKoreanDayUtcDate,
  toKoreanDateKey,
} = require('../utils/koreanTime');

class GitHubClient {
  constructor() {
    const token = process.env.GITHUB_TOKEN;
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        ...(token && { Authorization: `token ${token}` }),
        Accept: 'application/vnd.github.v3+json, application/vnd.github.cloak-preview+json',
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

  toDateKey(date) {
    return toKoreanDateKey(date);
  }

  getRecentRange(weeks = 26) {
    const untilKey = this.toDateKey(new Date());
    const sinceKey = addDaysToDateKey(untilKey, -(weeks * 7) + 1);

    return {
      since: dateKeyToKoreanDayUtcDate(sinceKey),
      until: dateKeyToKoreanDayUtcDate(untilKey, true),
      sinceKey,
      untilKey,
    };
  }

  async getDailyCommitCounts(username, { weeks = 26 } = {}) {
    const { since, until, sinceKey, untilKey } = this.getRecentRange(weeks);
    const dailyCounts = new Map();
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage && page <= 10) {
      const response = await this.client.get('/search/commits', {
        params: {
          q: `author:${username} author-date:${sinceKey}..${untilKey}`,
          sort: 'author-date',
          order: 'desc',
          per_page: 100,
          page,
        },
      });
      const items = response.data.items || [];

      items.forEach((item) => {
        const committedAt = item.commit?.author?.date || item.commit?.committer?.date;

        if (!committedAt) return;

        const committedDate = new Date(committedAt);

        if (Number.isNaN(committedDate.getTime()) || committedDate < since || committedDate > until) return;

        const dateKey = this.toDateKey(committedDate);
        dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
      });

      hasNextPage = items.length === 100;
      page += 1;
    }

    return [...dailyCounts.entries()]
      .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
      .map(([date, count]) => ({
        date,
        count,
      }));
  }

  async getUserContributionStats(username) {
    try {
      const [commitRes, prRes, dailyCommits] = await Promise.all([
        this.client.get('/search/commits', {
          params: { q: `author:${username}` },
        }),
        this.client.get('/search/issues', {
          params: { q: `author:${username} type:pr` },
        }),
        this.getDailyCommitCounts(username),
      ]);

      return {
        totalCommits: commitRes.data.total_count,
        totalPRs: prRes.data.total_count,
        dailyCommits,
      };
    } catch (error) {
      console.error(`[GitHub] 기여도 데이터 조회 실패 (${username}):`, error.message);
      return { totalCommits: 0, totalPRs: 0, dailyCommits: [] };
    }
  }
}

module.exports = new GitHubClient();
