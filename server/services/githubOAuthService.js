const crypto = require('crypto');
const axios = require('axios');

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const STATE_TTL_MS = 10 * 60 * 1000;

function getConfig(req) {
  const callbackURL = process.env.GITHUB_OAUTH_CALLBACK_URL
    || `${req.protocol}://${req.get('host')}/api/auth/github/callback`;

  return {
    clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
    clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    callbackURL,
    stateSecret: process.env.GITHUB_OAUTH_STATE_SECRET
      || process.env.JWT_SECRET
      || process.env.GITHUB_OAUTH_CLIENT_SECRET,
  };
}

function hasGithubOAuthConfig() {
  return Boolean(
    process.env.GITHUB_OAUTH_CLIENT_ID
      && process.env.GITHUB_OAUTH_CLIENT_SECRET
      && (process.env.GITHUB_OAUTH_STATE_SECRET || process.env.JWT_SECRET),
  );
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

function createState(origin, secret, linkUserId) {
  const payload = toBase64Url(JSON.stringify({
    origin: normalizeFrontendOrigin(origin),
    createdAt: Date.now(),
    userId: linkUserId,
  }));
  const signature = signValue(payload, secret);

  return `${payload}.${signature}`;
}

function parseState(state, secret) {
  const [payload, signature] = String(state || '').split('.');

  if (!payload || !signature) {
    throw new Error('GitHub OAuth state가 올바르지 않습니다.');
  }

  const expectedSignature = signValue(payload, secret);

  if (
    signature.length !== expectedSignature.length
      || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    throw new Error('GitHub OAuth state 검증에 실패했습니다.');
  }

  const parsed = JSON.parse(fromBase64Url(payload));

  if (!parsed.createdAt || Date.now() - parsed.createdAt > STATE_TTL_MS) {
    throw new Error('GitHub OAuth 요청 시간이 만료되었습니다.');
  }

  return parsed;
}

function normalizeFrontendOrigin(origin) {
  const fallbackOrigin = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5173';

  if (!origin) {
    return fallbackOrigin;
  }

  try {
    const url = new URL(origin);
    const isLocalDev = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    const configuredOrigins = (process.env.FRONTEND_ORIGIN || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    if (isLocalDev || configuredOrigins.includes(url.origin)) {
      return url.origin;
    }
  } catch {
    return fallbackOrigin;
  }

  return fallbackOrigin;
}

function buildGithubAuthorizeUrl(req, origin, linkUserId) {
  const config = getConfig(req);

  if (!hasGithubOAuthConfig()) {
    const error = new Error('GitHub OAuth 환경 변수가 설정되지 않았습니다.');
    error.statusCode = 503;
    error.publicMessage = 'GitHub OAuth 환경 변수가 설정되지 않았습니다. GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET, JWT_SECRET을 확인해주세요.';
    throw error;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackURL,
    scope: 'read:user',
    state: createState(origin, config.stateSecret, linkUserId),
    allow_signup: 'true',
  });

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeCodeForGithubUser(req, code) {
  const config = getConfig(req);

  const tokenResponse = await axios.post(
    GITHUB_TOKEN_URL,
    {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.callbackURL,
    },
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  const accessToken = tokenResponse.data?.access_token;

  if (!accessToken) {
    throw new Error(tokenResponse.data?.error_description || 'GitHub access token을 발급받지 못했습니다.');
  }

  const userResponse = await axios.get(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!userResponse.data?.login) {
    throw new Error('GitHub 사용자 정보를 불러오지 못했습니다.');
  }

  return {
    id: userResponse.data.id,
    login: userResponse.data.login,
    name: userResponse.data.name,
    avatarUrl: userResponse.data.avatar_url,
    profileUrl: userResponse.data.html_url,
  };
}

function getOriginFromState(req, state) {
  const config = getConfig(req);
  const parsedState = parseState(state, config.stateSecret);

  return normalizeFrontendOrigin(parsedState.origin);
}

function getGithubOAuthState(req, state) {
  const config = getConfig(req);
  const parsedState = parseState(state, config.stateSecret);

  return {
    ...parsedState,
    origin: normalizeFrontendOrigin(parsedState.origin),
  };
}

module.exports = {
  buildGithubAuthorizeUrl,
  exchangeCodeForGithubUser,
  getGithubOAuthState,
  getOriginFromState,
  hasGithubOAuthConfig,
  normalizeFrontendOrigin,
};
