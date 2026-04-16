const github = require('./crawlers/github');
const solvedac = require('./crawlers/solvedac');

async function runTest() {
  const githubHandle = process.argv[2] || 'octocat';
  const bojHandle = process.argv[3] || 'mazassumnida';
  console.log(`🚀 [테스트] GitHub: ${githubHandle}, BOJ: ${bojHandle}`);
  
  try {
    const profile = await github.getUserProfile(githubHandle);
    console.log(`✅ GitHub 프로필: ${profile.login}`);
  } catch (e) { console.error(`❌ GitHub 실패: ${e.message}`); }

  try {
    const info = await solvedac.getUserInfo(bojHandle);
    console.log(`✅ Solved.ac 프로필: ${info.handle}`);
  } catch (e) { console.error(`❌ Solved.ac 실패: ${e.message}`); }
}

runTest();
