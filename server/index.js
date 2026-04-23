const express = require('express');
const dotenv = require('dotenv');
const github = require('./crawlers/github');
const solvedac = require('./crawlers/solvedac');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// 유저 통합 역량 데이터 조회 API
app.get('/api/user/:githubId/:bojId', async (req, res) => {
  const { githubId, bojId } = req.params;
  
  try {
    const [ghProfile, ghStats, bojInfo] = await Promise.all([
      github.getUserProfile(githubId),
      github.getUserContributionStats(githubId),
      solvedac.getUserInfo(bojId)
    ]);

    res.json({
      success: true,
      data: {
        github: { ...ghProfile, ...ghStats },
        boj: bojInfo
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Link_U Backend Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
