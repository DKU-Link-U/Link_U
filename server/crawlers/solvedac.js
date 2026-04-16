const axios = require('axios');

class SolvedAcClient {
  constructor() {
    this.baseUrl = 'https://solved.ac/api/v3';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
  }

  async getUserInfo(handle) {
    try {
      const response = await this.client.get('/user/show', { params: { handle } });
      return response.data;
    } catch (error) {
      console.error(`[Solved.ac] 유저 정보 조회 실패 (${handle}):`, error.message);
      throw error;
    }
  }
}

module.exports = new SolvedAcClient();
