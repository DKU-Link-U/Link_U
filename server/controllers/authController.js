const passport = require('passport');
const { hasGoogleOAuthConfig } = require('../config/passport');

function startGoogleLogin(req, res, next) {
  if (!hasGoogleOAuthConfig()) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth 환경 변수가 설정되지 않았습니다.',
    });
  }

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next);
}

function handleGoogleCallback(req, res, next) {
  if (!hasGoogleOAuthConfig()) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth 환경 변수가 설정되지 않았습니다.',
    });
  }

  return passport.authenticate('google', { session: false }, (error, user) => {
    if (error) {
      const statusCode = error.statusCode || 401;

      return res.status(statusCode).json({
        success: false,
        message: error.publicMessage || 'Google 로그인에 실패했습니다.',
        error: error.message,
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Google 로그인에 실패했습니다.',
      });
    }

    return res.json({
      success: true,
      message: 'Google 로그인에 성공했습니다.',
      data: { user },
    });
  })(req, res, next);
}

module.exports = {
  startGoogleLogin,
  handleGoogleCallback,
};
