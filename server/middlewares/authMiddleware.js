const prisma = require('../config/prisma');
const { verifyAccessToken } = require('../utils/jwt');

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

async function authMiddleware(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 필요합니다.',
    });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 인증 토큰입니다.',
      });
    }

    req.user = user;
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 인증 토큰입니다.',
      error: error.message,
    });
  }
}

module.exports = authMiddleware;
