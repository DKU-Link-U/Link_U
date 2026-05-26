const passport = require('passport');
const { hasGoogleOAuthConfig } = require('../config/passport');
const {
  buildGithubAuthorizeUrl,
  exchangeCodeForGithubUser,
  getOriginFromState,
  normalizeFrontendOrigin,
} = require('../services/githubOAuthService');
const { generateAccessToken } = require('../utils/jwt');

const GITHUB_OAUTH_MESSAGE_TYPES = {
  success: 'LINK_U_GITHUB_OAUTH_SUCCESS',
  error: 'LINK_U_GITHUB_OAUTH_ERROR',
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sendGithubOAuthPopupResult(res, origin, payload, statusCode = 200) {
  const targetOrigin = normalizeFrontendOrigin(origin);
  const messagePayload = {
    source: 'link-u',
    platform: 'github',
    ...payload,
  };
  const title = payload.success ? 'GitHub 연동 완료' : 'GitHub 연동 실패';
  const message = payload.message || (payload.success
    ? 'GitHub 계정 연동이 완료되었습니다.'
    : 'GitHub 계정 연동에 실패했습니다.');

  return res.status(statusCode).send(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f8fafc;
      color: #111827;
    }
    main {
      width: min(360px, calc(100vw - 40px));
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      background: #fff;
      padding: 28px;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
      text-align: center;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 18px;
    }
    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #4b5563;
    }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  </main>
  <script>
    const payload = ${JSON.stringify(messagePayload)};
    const targetOrigin = ${JSON.stringify(targetOrigin)};

    if (window.opener) {
      window.opener.postMessage(payload, targetOrigin);
      window.setTimeout(() => window.close(), 150);
    }
  </script>
</body>
</html>`);
}

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
      data: {
        user,
        accessToken: generateAccessToken(user),
      },
    });
  })(req, res, next);
}

function startGithubLink(req, res) {
  try {
    const authorizeUrl = buildGithubAuthorizeUrl(req, req.query.origin);

    return res.redirect(authorizeUrl);
  } catch (error) {
    return sendGithubOAuthPopupResult(
      res,
      req.query.origin,
      {
        success: false,
        type: GITHUB_OAUTH_MESSAGE_TYPES.error,
        message: error.publicMessage || error.message,
      },
      error.statusCode || 500,
    );
  }
}

async function handleGithubCallback(req, res) {
  const { code, error, error_description: errorDescription, state } = req.query;
  let origin = req.query.origin;

  try {
    origin = getOriginFromState(req, state);

    if (error) {
      throw new Error(errorDescription || 'GitHub 로그인이 취소되었습니다.');
    }

    if (!code) {
      throw new Error('GitHub OAuth code가 전달되지 않았습니다.');
    }

    const githubUser = await exchangeCodeForGithubUser(req, code);

    return sendGithubOAuthPopupResult(res, origin, {
      success: true,
      type: GITHUB_OAUTH_MESSAGE_TYPES.success,
      username: githubUser.login,
      profileUrl: githubUser.profileUrl,
      avatarUrl: githubUser.avatarUrl,
      message: 'GitHub 계정 연동이 완료되었습니다.',
    });
  } catch (callbackError) {
    return sendGithubOAuthPopupResult(
      res,
      origin,
      {
        success: false,
        type: GITHUB_OAUTH_MESSAGE_TYPES.error,
        message: callbackError.publicMessage || callbackError.message || 'GitHub 계정 연동에 실패했습니다.',
      },
      callbackError.statusCode || 400,
    );
  }
}

module.exports = {
  startGoogleLogin,
  handleGoogleCallback,
  startGithubLink,
  handleGithubCallback,
};
