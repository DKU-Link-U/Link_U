const express = require('express');
const dotenv = require('dotenv');
const github = require('./crawlers/github');
const solvedac = require('./crawlers/solvedac');
const dreamhack = require('./crawlers/dreamhack');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

/**
 * 유저 통합 역량 데이터 조회 API
 * GitHub, Solved.ac, Dreamhack 데이터를 한 번에 수집하여 반환합니다.
 */
app.get('/api/user/:githubId/:bojId/:dhId', async (req, res) => {
  const { githubId, bojId, dhId } = req.params;
  
  try {
    // 세 플랫폼 데이터를 병렬로 비동기 수집
    const [ghProfile, ghStats, bojInfo, dhStats] = await Promise.all([
      github.getUserProfile(githubId),
      github.getUserContributionStats(githubId),
      solvedac.getUserInfo(bojId),
      dreamhack.getUserStats(dhId)
    ]);

    res.json({
      success: true,
      data: {
        github: { 
          profile: ghProfile,
          stats: ghStats 
        },
        boj: bojInfo,
        dreamhack: dhStats
      }
    });
  } catch (error) {
    console.error('[API Error] 데이터 통합 조회 실패:', error.message);
    res.status(500).json({ 
      success: false, 
      message: '데이터 수집 도중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Link_U Backend Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
