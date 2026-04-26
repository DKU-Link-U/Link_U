const axios = require('axios');

/**
 * Dreamhack API 연동 모듈
 * 내부 API를 활용하여 유저의 워게임 성취도 및 활동 데이터를 가져옵니다.
 */
class DreamhackClient {
  constructor() {
    this.baseUrl = 'https://dreamhack.io/api/v1/services/suggestion';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    };
  }

  /**
   * 유저 닉네임을 기반으로 상세 통계 정보를 가져옵니다.
   * @param {string} nickname - 드림핵 닉네임
   */
  async getUserStats(nickname) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          keyword: nickname,
          section: 'users',
          users_offset: 0,
          users_limit: 5
        },
        headers: this.headers
      });

      const results = response.data.users.results;
      // 닉네임이 정확히 일치하는 유저 찾기
      const user = results.find(u => u.nickname.toLowerCase() === nickname.toLowerCase());

      if (!user) {
        throw new Error(`유저를 찾을 수 없습니다: ${nickname}`);
      }

      const wargame = user.wargame || {};
      const contrib = user.contributions || {};

      return {
        id: user.id,
        nickname: user.nickname,
        wargame: {
          rank: wargame.rank || 0,
          score: wargame.score || 0,
          solvedCount: wargame.solved || 0,
          categories: wargame.category || {} // pwnable, web 등 상세 데이터
        },
        contributions: {
          level: contrib.level || 0,
          rank: contrib.rank || 0
        },
        platform: 'Dreamhack'
      };
    } catch (error) {
      console.error(`[Dreamhack] 데이터 조회 실패 (${nickname}):`, error.message);
      throw error;
    }
  }
}

module.exports = new DreamhackClient();
