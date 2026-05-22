const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { findOrCreateDankookUser } = require('../services/authService');

const requiredEnv = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'];

function hasGoogleOAuthConfig() {
  return requiredEnv.every((key) => Boolean(process.env[key]));
}

if (hasGoogleOAuthConfig()) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateDankookUser(profile);
          done(null, user);
        } catch (error) {
          done(error);
        }
      },
    ),
  );
} else {
  console.warn('[Auth] Google OAuth 환경 변수가 설정되지 않아 Google 로그인 라우트가 비활성화됩니다.');
}

module.exports = {
  hasGoogleOAuthConfig,
};
