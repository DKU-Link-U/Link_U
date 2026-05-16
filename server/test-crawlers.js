const github = require('./crawlers/github');
const solvedac = require('./crawlers/solvedac');
const dreamhack = require('./crawlers/dreamhack');

async function runTest() {
  const githubHandle = process.argv[2] || 'YeonHo0718';
  const bojHandle = process.argv[3] || 'ianshim0718';
  const dhHandle = process.argv[4] || 'yeono';

  console.log(`\n🚀 [통합 테스트 시작]`);
  console.log(`   GitHub: ${githubHandle} | BOJ: ${bojHandle} | Dreamhack: ${dhHandle}`);
  console.log('--------------------------------------------------');
  
  // 1. GitHub
  try {
    const profile = await github.getUserProfile(githubHandle);
    const contribs = await github.getUserContributionStats(githubHandle);
    console.log('✅ GitHub 데이터 로드 성공');
    console.log(`   - 이름: ${profile.name || profile.login}`);
    console.log(`   - 활동: 커밋 ${contribs.totalCommits}, PR ${contribs.totalPRs}`);
  } catch (error) { console.error('❌ GitHub 실패:', error.message); }

  // 2. Solved.ac
  try {
    const info = await solvedac.getUserInfo(bojHandle);
    console.log('\n✅ Solved.ac 데이터 로드 성공 (Puppeteer)');
    console.log(`   - 핸들: ${info.handle}`);
    console.log(`   - 티어: ${info.tier}, 푼 문제: ${info.solvedCount}`);
  } catch (error) { console.error('\n❌ Solved.ac 실패:', error.message); }

  // 3. Dreamhack
  try {
    const dhStats = await dreamhack.getUserStats(dhHandle);
    console.log(dhStats)
    console.log('\n✅ Dreamhack 데이터 로드 성공');
    console.log(`   - 닉네임: ${dhStats.nickname}`);
    console.log(`   - 워게임: ${dhStats.wargame.score} pts (순위: ${dhStats.wargame.rank}위)`);
    console.log(`   - 해결: ${dhStats.wargame.solvedCount}문제 (레벨: ${dhStats.contributions.level})`);
  } catch (error) { console.error('\n❌ Dreamhack 실패:', error.message); }

  console.log('\n--------------------------------------------------');
  console.log('✨ 테스트 종료\n');
}

runTest();
