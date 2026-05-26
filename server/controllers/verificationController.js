const github = require('../crawlers/github');
const solvedac = require('../crawlers/solvedac');
const dreamhack = require('../crawlers/dreamhack');

const PLATFORM_LOADERS = {
  github: (accountId) => github.getUserProfile(accountId),
  boj: (accountId) => solvedac.getUserInfo(accountId),
  dreamhack: (accountId) => dreamhack.getUserStats(accountId),
};

const PLATFORM_LABELS = {
  github: 'GitHub',
  boj: 'Solved.ac',
  baekjoon: 'Solved.ac',
  dreamhack: 'Dreamhack',
};

const PLATFORM_ALIASES = {
  baekjoon: 'boj',
};

function containsToken(value, token) {
  if (typeof value === 'string') {
    return value.includes(token);
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsToken(item, token));
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some((item) => containsToken(item, token));
  }

  return false;
}

async function verifyExternalAccount(req, res) {
  const { platform, accountId, token } = req.query;
  const platformKey = PLATFORM_ALIASES[platform] || platform;
  const loader = PLATFORM_LOADERS[platformKey];

  if (!loader) {
    return res.status(400).json({
      success: false,
      verified: false,
      message: '지원하지 않는 플랫폼입니다.',
    });
  }

  if (!accountId?.trim() || !token?.trim()) {
    return res.status(400).json({
      success: false,
      verified: false,
      message: '계정 아이디와 검증 코드가 모두 필요합니다.',
    });
  }

  try {
    const profile = await loader(accountId.trim());
    const verificationTarget = profile.verificationText || profile;
    const verified = containsToken(verificationTarget, token.trim());

    return res.json({
      success: true,
      verified,
      platform: platformKey,
      platformName: PLATFORM_LABELS[platform] || PLATFORM_LABELS[platformKey],
      accountId,
      message: verified
        ? '계정 소유 확인이 완료되었습니다.'
        : '공개 프로필에서 검증 코드를 찾지 못했습니다.',
    });
  } catch (error) {
    console.error(`[Verify:${platformKey}] 계정 소유 확인 실패:`, error.message);

    return res.status(error.statusCode || 502).json({
      success: false,
      verified: false,
      platform: platformKey,
      platformName: PLATFORM_LABELS[platform] || PLATFORM_LABELS[platformKey],
      accountId,
      message: error.publicMessage || '계정 소유 확인 중 외부 API 조회에 실패했습니다.',
      error: error.message,
    });
  }
}

module.exports = {
  verifyExternalAccount,
};
