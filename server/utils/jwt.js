const jwt = require('jsonwebtoken');

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
  }

  return process.env.JWT_SECRET;
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      subject: user.id,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
};
