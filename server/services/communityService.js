const recruitmentService = require('./recruitmentService');

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

module.exports = {
  createCommunityRecruitment,
  getCommunityRecruitmentById,
  getCommunityRecruitments,
};
