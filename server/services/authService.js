const prisma = require('../config/prisma');

const DANKOOK_EMAIL_DOMAIN = '@dankook.ac.kr';

function getPrimaryEmail(profile) {
  const email = profile.emails?.find((item) => item.verified)?.value || profile.emails?.[0]?.value;
  return email ? email.toLowerCase() : null;
}

function assertDankookEmail(email) {
  if (!email || !email.endsWith(DANKOOK_EMAIL_DOMAIN)) {
    const error = new Error('단국대학교 이메일 계정만 가입할 수 있습니다.');
    error.statusCode = 403;
    error.publicMessage = '단국대학교 이메일 계정만 가입할 수 있습니다.';
    throw error;
  }
}

function toSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    nickname: user.nickname,
    department: user.department,
    studentId: user.studentId,
    githubId: user.githubId,
    bojId: user.bojId,
    dreamhackId: user.dreamhackId,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function findOrCreateDankookUser(profile) {
  const email = getPrimaryEmail(profile);
  assertDankookEmail(email);

  const displayName = profile.displayName || null;

  const user = await prisma.user.upsert({
    where: { email },
    update: displayName ? { name: displayName } : {},
    create: {
      email,
      name: displayName,
      nickname: displayName,
    },
  });

  return toSafeUser(user);
}

module.exports = {
  findOrCreateDankookUser,
  toSafeUser,
};
