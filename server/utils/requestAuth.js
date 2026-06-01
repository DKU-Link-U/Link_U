const prisma = require('../config/prisma');
const { verifyAccessToken } = require('./jwt');

function getBearerToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

async function getUserFromAccessToken(accessToken) {
  if (!accessToken) {
    const error = new Error('인증 토큰이 필요합니다.');
    error.statusCode = 401;
    error.publicMessage = 'Link_U 로그인 후 계정을 연동해주세요.';
    throw error;
  }

  let payload;

  try {
    payload = verifyAccessToken(accessToken);
  } catch (jwtError) {
    const error = new Error(jwtError.message);
    error.statusCode = 401;
    error.publicMessage = 'Link_U 로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.';
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    const error = new Error('유효하지 않은 인증 토큰입니다.');
    error.statusCode = 401;
    error.publicMessage = 'Link_U 로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.';
    throw error;
  }

  return {
    payload,
    user,
  };
}

async function getUserFromRequest(req) {
  return getUserFromAccessToken(getBearerToken(req));
}

module.exports = {
  getBearerToken,
  getUserFromAccessToken,
  getUserFromRequest,
};
