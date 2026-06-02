const prisma = require('../config/prisma');

const DANKOOK_EMAIL_DOMAIN = '@dankook.ac.kr';

function getPrimaryEmail(profile) {
  const email = profile.emails?.find((item) => item.verified)?.value || profile.emails?.[0]?.value;
  return email ? email.toLowerCase() : null;
}

function assertDankookEmail(email) {
  if (!email || !email.endsWith(DANKOOK_EMAIL_DOMAIN)) {
    const error = new Error(`단국대학교 Google 계정(${DANKOOK_EMAIL_DOMAIN})으로만 로그인할 수 있습니다.`);
    error.statusCode = 403;
    error.publicMessage = `단국대학교 Google 계정(${DANKOOK_EMAIL_DOMAIN})으로만 로그인할 수 있습니다.`;
    throw error;
  }
}

function toSafeUser(user) {
  const nickname = user.nickname || user.name || user.email?.split('@')[0] || 'Link_U User';

  return {
    id: user.id,
    userId: user.id,
    email: user.email,
    name: user.name,
    nickname,
    department: user.department,
    studentId: user.studentId,
    oneLiner: user.oneLiner,
    techStack: user.techStack,
    interestArea: user.interestArea,
    profileImage: user.profileImage,
    university: '단국대학교',
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
