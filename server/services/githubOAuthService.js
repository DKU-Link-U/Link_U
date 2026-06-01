const crypto = require('crypto');
const axios = require('axios');

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const STATE_TTL_MS = 10 * 60 * 1000;

function readEnvValue(key) {
  return String(process.env[key] || '').trim().replace(/^["']|["']$/g, '');
}

function getConfig(req) {
  const callbackURL = readEnvValue('GITHUB_OAUTH_CALLBACK_URL')
    || `${req.protocol}://${req.get('host')}/api/auth/github/callback`;

  return {
    clientId: readEnvValue('GITHUB_OAUTH_CLIENT_ID'),
    clientSecret: readEnvValue('GITHUB_OAUTH_CLIENT_SECRET'),
    callbackURL,
    stateSecret: readEnvValue('GITHUB_OAUTH_STATE_SECRET')
      || readEnvValue('JWT_SECRET')
      || readEnvValue('GITHUB_OAUTH_CLIENT_SECRET'),
  };
}

function getGithubOAuthConfigIssues(config = {
  clientId: readEnvValue('GITHUB_OAUTH_CLIENT_ID'),
  clientSecret: readEnvValue('GITHUB_OAUTH_CLIENT_SECRET'),
  stateSecret: readEnvValue('GITHUB_OAUTH_STATE_SECRET') || readEnvValue('JWT_SECRET'),
}) {
  const issues = [];

  if (!config.clientId) {
    issues.push('GITHUB_OAUTH_CLIENT_ID가 비어 있습니다.');
  }

  if (!config.clientSecret) {
    issues.push('GITHUB_OAUTH_CLIENT_SECRET이 비어 있습니다.');
  } else if (config.clientSecret === config.clientId) {
    issues.push('GITHUB_OAUTH_CLIENT_SECRET에 Client ID가 들어간 것으로 보입니다.');
  } else if (config.clientSecret.length < 30 || /^Iv1\.|^Ov23/i.test(config.clientSecret)) {
    issues.push('GITHUB_OAUTH_CLIENT_SECRET 값이 GitHub OAuth Client Secret 형식이 아닙니다.');
  }

  if (!config.stateSecret) {
    issues.push('JWT_SECRET 또는 GITHUB_OAUTH_STATE_SECRET이 필요합니다.');
  }

  return issues;
}

function createGithubOAuthConfigError(issues) {
  const error = new Error(issues.join(' '));
  error.statusCode = 503;
  error.publicMessage = [
    'GitHub OAuth 설정이 올바르지 않습니다.',
    'GitHub Developer settings > OAuth Apps에서 Client ID와 Client Secret을 다시 확인한 뒤 server/.env를 수정하고 백엔드 서버를 재시작해주세요.',
    issues.join(' '),
  ].join(' ');

  return error;
}

function assertGithubOAuthConfig(req) {
  const config = getConfig(req);
  const issues = getGithubOAuthConfigIssues(config);

  if (issues.length > 0) {
    throw createGithubOAuthConfigError(issues);
  }

  return config;
}

function hasGithubOAuthConfig() {
  return getGithubOAuthConfigIssues().length === 0;
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
  const config = assertGithubOAuthConfig(req);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackURL,
    scope: 'read:user',
    state: createState(origin, config.stateSecret, linkUserId),
    allow_signup: 'true',
    prompt: 'select_account',
  });

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeCodeForGithubUser(req, code) {
  const config = assertGithubOAuthConfig(req);

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
    const tokenError = new Error(tokenResponse.data?.error_description || 'GitHub access token을 발급받지 못했습니다.');
    tokenError.statusCode = 400;

    if (tokenResponse.data?.error === 'incorrect_client_credentials') {
      tokenError.publicMessage = 'GitHub OAuth Client ID 또는 Client Secret이 올바르지 않습니다. GitHub OAuth App에서 값을 다시 발급받아 server/.env에 설정한 뒤 백엔드 서버를 재시작해주세요.';
    } else if (tokenResponse.data?.error === 'bad_verification_code') {
      tokenError.publicMessage = 'GitHub 로그인 코드가 만료되었거나 이미 사용되었습니다. GitHub 연동을 다시 시도해주세요.';
    }

    throw tokenError;
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
  getGithubOAuthConfigIssues,
  getGithubOAuthState,
  getOriginFromState,
  hasGithubOAuthConfig,
  normalizeFrontendOrigin,
};
