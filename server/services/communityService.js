const recruitmentService = require('./recruitmentService');
const prisma = require('../config/prisma');

function toCommunityStatus(status) {
  return status === 'OPEN' ? 'recruiting' : 'closed';
}

function parseCsv(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function toRecruitmentPayload(type, body) {
  return {
    title: body.title,
    description: body.description,
    type,
    requiredSkills: body.requiredSkills || parseCsv(body.techStack),
    requiredRoles: body.requiredRoles || [],
    maxMembers: body.maxMembers ?? body.capacity,
    startDate: body.startDate,
    endDate: body.endDate,
  };
}

function toCommunityItem(recruitment) {
  const isStudy = recruitment.type === 'STUDY';
  const idKey = isStudy ? 'groupId' : 'projectId';

  return {
    [idKey]: recruitment.id,
    id: recruitment.id,
    leaderId: recruitment.authorId,
    leaderName: recruitment.author?.nickname || recruitment.author?.name || 'Unknown',
    title: recruitment.title,
    description: recruitment.description,
    requiredRating: 0,
    capacity: recruitment.maxMembers || 0,
    currentCount: 1 + (recruitment._count?.applications || 0),
    techStack: recruitment.requiredSkills,
    requiredRoles: recruitment.requiredRoles,
    applicantList: [],
    status: toCommunityStatus(recruitment.status),
    createdAt: recruitment.createdAt.toISOString().slice(0, 10),
    startDate: recruitment.startDate,
    endDate: recruitment.endDate,
  };
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

function toApplicationItem(application) {
  return {
    id: application.id,
    userId: application.applicantId,
    applicantId: application.applicantId,
    recruitmentId: application.recruitmentId,
    status: application.status.toLowerCase(),
    message: application.message,
    appliedAt: application.createdAt.toISOString(),
    applicant: application.applicant ? {
      id: application.applicant.id,
      email: application.applicant.email,
      name: application.applicant.name,
      nickname: application.applicant.nickname,
      department: application.applicant.department,
      githubId: application.applicant.githubId,
      bojId: application.applicant.bojId,
      dreamhackId: application.applicant.dreamhackId,
    } : undefined,
  };
}

function assertRecruitmentAuthor(recruitment, userId) {
  if (recruitment.authorId !== userId) {
    throw createHttpError(403, '모집글 작성자만 지원자를 관리할 수 있습니다.');
  }
}

async function createCommunityRecruitment(type, authorId, body) {
  const recruitment = await recruitmentService.createRecruitment(authorId, toRecruitmentPayload(type, body));
  return toCommunityItem(recruitment);
}

async function getCommunityRecruitments(type, query) {
  const result = await recruitmentService.getRecruitments({
    ...query,
    type,
    status: query.status === 'closed' ? 'CLOSED' : query.status === 'recruiting' ? 'OPEN' : query.status,
  });

  return result.items.map(toCommunityItem);
}

async function getCommunityRecruitmentById(type, id) {
  const recruitment = await recruitmentService.getRecruitmentById(id);

  if (recruitment.type !== type) {
    const error = new Error('모집글을 찾을 수 없습니다.');
    error.statusCode = 404;
    error.publicMessage = '모집글을 찾을 수 없습니다.';
    throw error;
  }

  return toCommunityItem(recruitment);
}

async function applyCommunityRecruitment(type, recruitmentId, applicantId, body = {}) {
  const recruitment = await recruitmentService.getRecruitmentById(recruitmentId);

  if (recruitment.type !== type) {
    throw createHttpError(404, '모집글을 찾을 수 없습니다.');
  }

  if (recruitment.status !== 'OPEN') {
    throw createHttpError(400, '마감된 모집글에는 지원할 수 없습니다.');
  }

  if (recruitment.authorId === applicantId) {
    throw createHttpError(400, '자신이 작성한 모집글에는 지원할 수 없습니다.');
  }

  const existingApplication = await prisma.application.findUnique({
    where: {
      recruitmentId_applicantId: {
        recruitmentId,
        applicantId,
      },
    },
  });

  if (existingApplication) {
    throw createHttpError(409, '이미 지원한 모집글입니다.');
  }

  const application = await prisma.application.create({
    data: {
      recruitmentId,
      applicantId,
      message: body.message || null,
    },
  });

  return toApplicationItem(application);
}

async function getCommunityApplications(type, recruitmentId, requesterId) {
  const recruitment = await recruitmentService.getRecruitmentById(recruitmentId);

  if (recruitment.type !== type) {
    throw createHttpError(404, '모집글을 찾을 수 없습니다.');
  }

  assertRecruitmentAuthor(recruitment, requesterId);

  const applications = await prisma.application.findMany({
    where: { recruitmentId },
    include: {
      applicant: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return applications.map(toApplicationItem);
}

async function updateApplicationStatus(applicationId, requesterId, status) {
  const normalizedStatus = String(status || '').toUpperCase();

  if (!['ACCEPTED', 'REJECTED', 'PENDING', 'CANCELED'].includes(normalizedStatus)) {
    throw createHttpError(400, '지원 상태는 accepted, rejected, pending, canceled 중 하나여야 합니다.');
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      recruitment: true,
    },
  });

  if (!application) {
    throw createHttpError(404, '지원 내역을 찾을 수 없습니다.');
  }

  assertRecruitmentAuthor(application.recruitment, requesterId);

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: { status: normalizedStatus },
    include: {
      applicant: true,
    },
  });

  return toApplicationItem(updatedApplication);
}

module.exports = {
  applyCommunityRecruitment,
  createCommunityRecruitment,
  getCommunityApplications,
  getCommunityRecruitmentById,
  getCommunityRecruitments,
  updateApplicationStatus,
};
