const prisma = require('../config/prisma');
const { toSafeUser } = require('./authService');

const PLATFORM_FIELDS = {
  github: {
    field: 'githubId',
    label: 'GitHub',
  },
  boj: {
    field: 'bojId',
    label: 'Solved.ac',
  },
  baekjoon: {
    field: 'bojId',
    key: 'boj',
    label: 'Solved.ac',
  },
  dreamhack: {
    field: 'dreamhackId',
    label: 'Dreamhack',
  },
};

function getPlatformConfig(platform) {
  const config = PLATFORM_FIELDS[platform];

  if (!config) {
    const error = new Error('지원하지 않는 플랫폼입니다.');
    error.statusCode = 400;
    error.publicMessage = '지원하지 않는 플랫폼입니다.';
    throw error;
  }

  return {
    key: config.key || platform,
    ...config,
  };
}

async function linkExternalAccount(userId, platform, accountId) {
  const config = getPlatformConfig(platform);
  const normalizedAccountId = String(accountId || '').trim();

  if (!normalizedAccountId) {
    const error = new Error('연동할 계정 아이디가 필요합니다.');
    error.statusCode = 400;
    error.publicMessage = '연동할 계정 아이디가 필요합니다.';
    throw error;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      [config.field]: normalizedAccountId,
    },
  });

  return {
    platform: config.key,
    platformName: config.label,
    accountId: normalizedAccountId,
    user: toSafeUser(user),
  };
}

async function unlinkExternalAccount(userId, platform) {
  const config = getPlatformConfig(platform);
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      [config.field]: null,
    },
  });

  return {
    platform: config.key,
    platformName: config.label,
    user: toSafeUser(user),
  };
}

module.exports = {
  getPlatformConfig,
  linkExternalAccount,
  unlinkExternalAccount,
};
