const crypto = require('crypto');
const passport = require('passport');
const { hasGoogleOAuthConfig } = require('../config/passport');
const {
  buildGithubAuthorizeUrl,
  exchangeCodeForGithubUser,
  getGithubOAuthState,
  normalizeFrontendOrigin,
} = require('../services/githubOAuthService');
const { linkExternalAccount } = require('../services/accountLinkService');
const { getUserFromAccessToken } = require('../utils/requestAuth');
const { generateAccessToken } = require('../utils/jwt');

const GITHUB_OAUTH_MESSAGE_TYPES = {
  success: 'LINK_U_GITHUB_OAUTH_SUCCESS',
  error: 'LINK_U_GITHUB_OAUTH_ERROR',
};

const GOOGLE_OAUTH_MESSAGE_TYPES = {
  success: 'LINK_U_GOOGLE_OAUTH_SUCCESS',
  error: 'LINK_U_GOOGLE_OAUTH_ERROR',
};

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sendOAuthPopupResult(res, origin, platform, platformLabel, payload, statusCode = 200) {
  const targetOrigin = normalizeFrontendOrigin(origin);
  const messagePayload = {
    source: 'link-u',
    platform,
    ...payload,
  };
  const title = payload.success ? `${platformLabel} 인증 완료` : `${platformLabel} 인증 실패`;
  const message = payload.message || (payload.success
    ? `${platformLabel} 인증이 완료되었습니다.`
    : `${platformLabel} 인증에 실패했습니다.`);

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

function sendGithubOAuthPopupResult(res, origin, payload, statusCode = 200) {
  return sendOAuthPopupResult(res, origin, 'github', 'GitHub', payload, statusCode);
}

function sendGoogleOAuthPopupResult(res, origin, payload, statusCode = 200) {
  return sendOAuthPopupResult(res, origin, 'google', 'Google', payload, statusCode);
}

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signValue(value, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(value)
    .digest('base64url');
}

function getGoogleOAuthStateSecret() {
  return process.env.GOOGLE_OAUTH_STATE_SECRET
    || process.env.JWT_SECRET
    || process.env.GOOGLE_CLIENT_SECRET;
}

function createGoogleOAuthState(origin) {
  const secret = getGoogleOAuthStateSecret();
  const payload = toBase64Url(JSON.stringify({
    origin: normalizeFrontendOrigin(origin),
    createdAt: Date.now(),
  }));
  const signature = signValue(payload, secret);

  return `${payload}.${signature}`;
}

function parseGoogleOAuthState(state) {
  const secret = getGoogleOAuthStateSecret();
  const [payload, signature] = String(state || '').split('.');

  if (!payload || !signature) {
    throw new Error('Google OAuth state가 올바르지 않습니다.');
  }

  const expectedSignature = signValue(payload, secret);

  if (
    signature.length !== expectedSignature.length
      || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    throw new Error('Google OAuth state 검증에 실패했습니다.');
  }

  const parsed = JSON.parse(fromBase64Url(payload));

  if (!parsed.createdAt || Date.now() - parsed.createdAt > OAUTH_STATE_TTL_MS) {
    throw new Error('Google OAuth 요청 시간이 만료되었습니다.');
  }

  return parsed;
}

function getGoogleOAuthOrigin(req) {
  if (!req.query.state) {
    return normalizeFrontendOrigin(req.query.origin);
  }

  return normalizeFrontendOrigin(parseGoogleOAuthState(req.query.state).origin);
}

function startGoogleLogin(req, res, next) {
  if (!hasGoogleOAuthConfig()) {
    return sendGoogleOAuthPopupResult(
      res,
      req.query.origin,
      {
        success: false,
        type: GOOGLE_OAUTH_MESSAGE_TYPES.error,
        message: 'Google OAuth 환경 변수가 설정되지 않았습니다.',
      },
      503,
    );
  }

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
    hd: 'dankook.ac.kr',
    state: createGoogleOAuthState(req.query.origin),
  })(req, res, next);
}

function handleGoogleCallback(req, res, next) {
  let origin;

  try {
    origin = getGoogleOAuthOrigin(req);
  } catch (stateError) {
    return sendGoogleOAuthPopupResult(
      res,
      req.query.origin,
      {
        success: false,
        type: GOOGLE_OAUTH_MESSAGE_TYPES.error,
        message: stateError.message,
      },
      400,
    );
  }

  if (!hasGoogleOAuthConfig()) {
    return sendGoogleOAuthPopupResult(
      res,
      origin,
      {
        success: false,
        type: GOOGLE_OAUTH_MESSAGE_TYPES.error,
        message: 'Google OAuth 환경 변수가 설정되지 않았습니다.',
      },
      503,
    );
  }

  return passport.authenticate('google', { session: false }, (error, user) => {
    if (error) {
      const statusCode = error.statusCode || 401;

      return sendGoogleOAuthPopupResult(res, origin, {
        success: false,
        type: GOOGLE_OAUTH_MESSAGE_TYPES.error,
        message: error.publicMessage || 'Google 로그인에 실패했습니다.',
        error: error.message,
      }, statusCode);
    }

    if (!user) {
      return sendGoogleOAuthPopupResult(res, origin, {
        success: false,
        type: GOOGLE_OAUTH_MESSAGE_TYPES.error,
        message: 'Google 로그인에 실패했습니다.',
      }, 401);
    }

    return sendGoogleOAuthPopupResult(res, origin, {
      success: true,
      type: GOOGLE_OAUTH_MESSAGE_TYPES.success,
      message: 'Google 로그인에 성공했습니다.',
      user,
      accessToken: generateAccessToken(user),
    });
  })(req, res, next);
}

async function startGithubLink(req, res) {
  try {
    const { user } = await getUserFromAccessToken(req.query.linkToken);
    const authorizeUrl = buildGithubAuthorizeUrl(req, req.query.origin, user.id);

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
    const oauthState = getGithubOAuthState(req, state);
    origin = oauthState.origin;

    if (!oauthState.userId) {
      const authError = new Error('GitHub 연동을 시작한 Link_U 사용자를 확인할 수 없습니다.');
      authError.statusCode = 401;
      authError.publicMessage = 'Link_U 로그인 후 GitHub 계정 연동을 다시 시도해주세요.';
      throw authError;
    }

    if (error) {
      throw new Error(errorDescription || 'GitHub 로그인이 취소되었습니다.');
    }

    if (!code) {
      throw new Error('GitHub OAuth code가 전달되지 않았습니다.');
    }

    const githubUser = await exchangeCodeForGithubUser(req, code);
    const linkedAccount = await linkExternalAccount(oauthState.userId, 'github', githubUser.login);

    return sendGithubOAuthPopupResult(res, origin, {
      success: true,
      type: GITHUB_OAUTH_MESSAGE_TYPES.success,
      username: githubUser.login,
      profileUrl: githubUser.profileUrl,
      avatarUrl: githubUser.avatarUrl,
      persisted: true,
      user: linkedAccount.user,
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
