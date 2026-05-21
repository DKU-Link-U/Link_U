const recruitmentService = require('./recruitmentService');
const prisma = require('../config/prisma');
const { createNotification } = require('./notificationService');

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

function getAcceptedApplicationCount(recruitment) {
  if (!Array.isArray(recruitment.applications)) {
    return 0;
  }

  return recruitment.applications.filter(application => application.status === 'ACCEPTED').length;
}

function getCapacity(recruitment) {
  const capacity = Number(recruitment.maxMembers);
  return Number.isFinite(capacity) && capacity > 0 ? capacity : null;
}

function getAcceptedApplicantLimit(recruitment) {
  const capacity = getCapacity(recruitment);
  return capacity === null ? null : Math.max(capacity - 1, 0);
}

function toCommunityItem(recruitment) {
  const isStudy = recruitment.type === 'STUDY';
  const idKey = isStudy ? 'groupId' : 'projectId';
  const acceptedApplicationCount = getAcceptedApplicationCount(recruitment);

  return {
    [idKey]: recruitment.id,
    id: recruitment.id,
    leaderId: recruitment.authorId,
    leaderName: recruitment.author?.nickname || recruitment.author?.name || 'Unknown',
    title: recruitment.title,
    description: recruitment.description,
    requiredRating: 0,
    capacity: recruitment.maxMembers || 0,
    currentCount: 1 + acceptedApplicationCount,
    acceptedCount: acceptedApplicationCount,
    applicantCount: recruitment._count?.applications ?? recruitment.applications?.length ?? 0,
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

function toApplicationStatusLabel(status) {
  return {
    ACCEPTED: '승인',
    REJECTED: '거절',
    PENDING: '검토 중',
    CANCELED: '취소',
  }[status] || status;
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

async function assertRecruitmentHasOpenSlot(recruitment, excludeApplicationId) {
  const acceptedApplicantLimit = getAcceptedApplicantLimit(recruitment);

  if (acceptedApplicantLimit === null) {
    return;
  }

  const where = {
    recruitmentId: recruitment.id,
    status: 'ACCEPTED',
  };

  if (excludeApplicationId) {
    where.NOT = { id: excludeApplicationId };
  }

  const acceptedApplicantCount = await prisma.application.count({ where });

  if (acceptedApplicantCount >= acceptedApplicantLimit) {
    throw createHttpError(409, '모집 정원이 모두 찼습니다.');
  }
}

async function closeRecruitmentIfFull(recruitment) {
  const acceptedApplicantLimit = getAcceptedApplicantLimit(recruitment);

  if (acceptedApplicantLimit === null || recruitment.status !== 'OPEN') {
    return;
  }

  const acceptedApplicantCount = await prisma.application.count({
    where: {
      recruitmentId: recruitment.id,
      status: 'ACCEPTED',
    },
  });

  if (acceptedApplicantCount >= acceptedApplicantLimit) {
    await prisma.recruitment.update({
      where: { id: recruitment.id },
      data: { status: 'CLOSED' },
    });
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

  await assertRecruitmentHasOpenSlot(recruitment);

  const application = await prisma.application.create({
    data: {
      recruitmentId,
      applicantId,
      message: body.message || null,
    },
    include: {
      applicant: true,
    },
  });

  await createNotification({
    receiverId: recruitment.authorId,
    type: type === 'STUDY' ? 'STUDY_APPLICATION' : 'PROJECT_APPLICATION',
    content: `${application.applicant?.nickname || application.applicant?.name || '지원자'}님이 ${recruitment.title}에 지원했습니다.`,
    metadata: {
      applicationId: application.id,
      recruitmentId,
      applicantId,
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

async function getMyCommunityRecruitments(type, userId) {
  const recruitments = await prisma.recruitment.findMany({
    where: {
      type,
      OR: [
        { authorId: userId },
        {
          applications: {
            some: {
              applicantId: userId,
            },
          },
        },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true,
          department: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
      applications: {
        include: {
          applicant: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return recruitments.map((recruitment) => {
    const myRawApplication = recruitment.applications.find(application => application.applicantId === userId);
    const myApplication = myRawApplication
      ? toApplicationItem(myRawApplication)
      : null;

    return {
      ...toCommunityItem(recruitment),
      role: recruitment.authorId === userId ? 'owner' : 'applicant',
      myApplication,
      applicationStatus: myApplication?.status || null,
    };
  });
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

  if (normalizedStatus === 'ACCEPTED') {
    if (application.recruitment.status !== 'OPEN' && application.status !== 'ACCEPTED') {
      throw createHttpError(400, '마감된 모집글에는 지원자를 승인할 수 없습니다.');
    }

    await assertRecruitmentHasOpenSlot(application.recruitment, application.id);
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: { status: normalizedStatus },
    include: {
      applicant: true,
      recruitment: true,
    },
  });

  if (normalizedStatus === 'ACCEPTED') {
    await closeRecruitmentIfFull(updatedApplication.recruitment);
  }

  await createNotification({
    receiverId: updatedApplication.applicantId,
    type: updatedApplication.recruitment.type === 'STUDY' ? 'STUDY_RESULT' : 'PROJECT_RESULT',
    content: `${updatedApplication.recruitment.title} 지원 결과가 ${toApplicationStatusLabel(updatedApplication.status)} 상태로 변경되었습니다.`,
    metadata: {
      applicationId: updatedApplication.id,
      recruitmentId: updatedApplication.recruitmentId,
      status: updatedApplication.status,
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
  getMyCommunityRecruitments,
  updateApplicationStatus,
};
