const prisma = require('../config/prisma');

const VALID_TYPES = new Set(['STUDY', 'PROJECT']);
const VALID_STATUSES = new Set(['OPEN', 'CLOSED']);

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

function toStringArray(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw createHttpError(400, `${fieldName}은 배열이어야 합니다.`);
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function toOptionalDate(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return value === undefined ? undefined : null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createHttpError(400, `${fieldName} 날짜 형식이 올바르지 않습니다.`);
  }

  return date;
}

function toOptionalPositiveInt(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return value === undefined ? undefined : null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw createHttpError(400, `${fieldName}은 양의 정수여야 합니다.`);
  }

  return number;
}

function normalizeCreateInput(body) {
  const title = body.title?.trim();
  const description = body.description?.trim();

  if (!title) {
    throw createHttpError(400, '제목은 필수입니다.');
  }

  if (!description) {
    throw createHttpError(400, '본문은 필수입니다.');
  }

  if (!VALID_TYPES.has(body.type)) {
    throw createHttpError(400, '모집 유형은 STUDY 또는 PROJECT여야 합니다.');
  }

  return {
    title,
    description,
    type: body.type,
    requiredSkills: toStringArray(body.requiredSkills, 'requiredSkills') || [],
    requiredRoles: toStringArray(body.requiredRoles, 'requiredRoles') || [],
    maxMembers: toOptionalPositiveInt(body.maxMembers, 'maxMembers'),
    startDate: toOptionalDate(body.startDate, 'startDate'),
    endDate: toOptionalDate(body.endDate, 'endDate'),
  };
}

function normalizeUpdateInput(body) {
  const data = {};

  if (body.title !== undefined) {
    const title = body.title?.trim();

    if (!title) {
      throw createHttpError(400, '제목은 비워둘 수 없습니다.');
    }

    data.title = title;
  }

  if (body.description !== undefined) {
    const description = body.description?.trim();

    if (!description) {
      throw createHttpError(400, '본문은 비워둘 수 없습니다.');
    }

    data.description = description;
  }

  if (body.type !== undefined) {
    if (!VALID_TYPES.has(body.type)) {
      throw createHttpError(400, '모집 유형은 STUDY 또는 PROJECT여야 합니다.');
    }

    data.type = body.type;
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status)) {
      throw createHttpError(400, '모집 상태는 OPEN 또는 CLOSED여야 합니다.');
    }

    data.status = body.status;
  }

  const requiredSkills = toStringArray(body.requiredSkills, 'requiredSkills');
  const requiredRoles = toStringArray(body.requiredRoles, 'requiredRoles');
  const maxMembers = toOptionalPositiveInt(body.maxMembers, 'maxMembers');
  const startDate = toOptionalDate(body.startDate, 'startDate');
  const endDate = toOptionalDate(body.endDate, 'endDate');

  if (requiredSkills !== undefined) data.requiredSkills = requiredSkills;
  if (requiredRoles !== undefined) data.requiredRoles = requiredRoles;
  if (maxMembers !== undefined) data.maxMembers = maxMembers;
  if (startDate !== undefined) data.startDate = startDate;
  if (endDate !== undefined) data.endDate = endDate;

  return data;
}

function includeAuthor() {
  return {
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
  };
}

async function findRecruitmentOrThrow(id) {
  const recruitment = await prisma.recruitment.findUnique({
    where: { id },
  });

  if (!recruitment) {
    throw createHttpError(404, '모집글을 찾을 수 없습니다.');
  }

  return recruitment;
}

function assertAuthor(recruitment, userId) {
  if (recruitment.authorId !== userId) {
    throw createHttpError(403, '모집글 작성자만 변경할 수 있습니다.');
  }
}

async function createRecruitment(authorId, body) {
  const data = normalizeCreateInput(body);

  return prisma.recruitment.create({
    data: {
      ...data,
      authorId,
    },
    include: includeAuthor(),
  });
}

async function getRecruitments(query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 50);
  const where = {};

  if (query.type) {
    if (!VALID_TYPES.has(query.type)) {
      throw createHttpError(400, '모집 유형은 STUDY 또는 PROJECT여야 합니다.');
    }

    where.type = query.type;
  }

  if (query.status) {
    if (!VALID_STATUSES.has(query.status)) {
      throw createHttpError(400, '모집 상태는 OPEN 또는 CLOSED여야 합니다.');
    }

    where.status = query.status;
  }

  const [items, total] = await Promise.all([
    prisma.recruitment.findMany({
      where,
      include: includeAuthor(),
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.recruitment.count({ where }),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

async function getRecruitmentById(id) {
  const recruitment = await prisma.recruitment.findUnique({
    where: { id },
    include: includeAuthor(),
  });

  if (!recruitment) {
    throw createHttpError(404, '모집글을 찾을 수 없습니다.');
  }

  return recruitment;
}

async function updateRecruitment(id, userId, body) {
  const recruitment = await findRecruitmentOrThrow(id);
  assertAuthor(recruitment, userId);

  const data = normalizeUpdateInput(body);

  return prisma.recruitment.update({
    where: { id },
    data,
    include: includeAuthor(),
  });
}

async function deleteRecruitment(id, userId) {
  const recruitment = await findRecruitmentOrThrow(id);
  assertAuthor(recruitment, userId);

  return prisma.recruitment.delete({
    where: { id },
  });
}

module.exports = {
  createRecruitment,
  deleteRecruitment,
  getRecruitmentById,
  getRecruitments,
  updateRecruitment,
};
