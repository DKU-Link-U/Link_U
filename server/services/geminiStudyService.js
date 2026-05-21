const axios = require('axios');
const prisma = require('../config/prisma');
const communityService = require('./communityService');

const GEMINI_API_BASE_URL = (process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
const MAX_RECOMMENDATIONS = 3;

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '').trim();
}

function getGeminiModel() {
  return (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).replace(/^models\//, '').trim();
}

function splitTags(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  if (!value) return [];

  return String(value)
    .split(/[,/|·\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeScore(value) {
  const score = Number(value);

  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

async function getRecommendationUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      activityStats: true,
      score: true,
    },
  });
}

function toUserProfile(user) {
  return {
    nickname: user.nickname || user.name || user.email?.split('@')[0] || 'Link_U 사용자',
    department: user.department,
    year: user.year,
    oneLiner: user.oneLiner,
    techStack: splitTags(user.techStack),
    interestArea: splitTags(user.interestArea),
    accounts: {
      github: user.githubId,
      boj: user.bojId,
      dreamhack: user.dreamhackId,
    },
    scores: {
      total: Number(user.score?.totalScore ?? user.activityStats?.totalRatingScore ?? 0),
      algorithm: Number(user.score?.algorithmScore ?? 0),
      security: Number(user.score?.securityScore ?? 0),
      implementation: Number(user.score?.implementationScore ?? 0),
      collaboration: Number(user.score?.collaborationScore ?? 0),
      activity: Number(user.score?.activityScore ?? 0),
    },
    activity: {
      githubCommitCount: Number(user.activityStats?.githubCommitCount ?? 0),
      githubPrCount: Number(user.activityStats?.githubPrCount ?? 0),
      bojSolvedCount: Number(user.activityStats?.bojSolvedCount ?? 0),
      dreamhackSolvedCount: Number(user.activityStats?.dreamhackSolvedCount ?? 0),
    },
  };
}

function toStudyPromptItem(study) {
  return {
    studyId: study.groupId,
    title: study.title,
    description: study.description,
    techStack: study.techStack,
    requiredRating: study.requiredRating,
    capacity: study.capacity,
    currentCount: study.currentCount,
    status: study.status,
  };
}

function buildPrompt(userProfile, studies) {
  return [
    '너는 Link_U의 교내 개발 스터디 매칭 어시스턴트다.',
    '사용자 프로필과 모집 중인 스터디 목록을 보고 가장 잘 맞는 스터디를 최대 3개 추천해라.',
    '반드시 아래 JSON 배열 형식만 반환해라. Markdown, 설명 문장, 코드블록은 쓰지 마라.',
    '[{"studyId":"스터디 id","fitScore":0-100,"reason":"한국어 한 문장 추천 이유","matchedSkills":["기술1","기술2"]}]',
    '',
    `사용자 프로필: ${JSON.stringify(userProfile)}`,
    `스터디 목록: ${JSON.stringify(studies.map(toStudyPromptItem))}`,
  ].join('\n');
}

function extractGeminiText(response) {
  return response.data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text)
    .filter(Boolean)
    .join('')
    .trim() || '';
}

function parseGeminiJson(text) {
  if (!text) return [];

  const normalizedText = text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(normalizedText);

    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.recommendations)) return parsed.recommendations;
  } catch {
    const jsonMatch = normalizedText.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  }

  return [];
}

async function callGemini(prompt) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw createHttpError(503, 'Gemini API 키가 설정되지 않았습니다. server/.env에 GEMINI_API_KEY를 추가해주세요.');
  }

  const model = getGeminiModel();
  const url = `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const response = await axios.post(url, {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: 'application/json',
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      timeout: 20000,
    });

    return parseGeminiJson(extractGeminiText(response));
  } catch (error) {
    if (error.statusCode) throw error;

    const message = error.response?.data?.error?.message || error.message;
    throw createHttpError(502, `Gemini 추천 생성에 실패했습니다: ${message}`);
  }
}

function findStudyByAiItem(item, studies, usedIds) {
  const studyId = item.studyId || item.groupId || item.id;
  const byId = studies.find(study => study.groupId === studyId && !usedIds.has(study.groupId));

  if (byId) return byId;

  const title = String(item.title || '').trim().toLowerCase();
  if (!title) return null;

  return studies.find(study =>
    !usedIds.has(study.groupId) && study.title.trim().toLowerCase() === title
  ) || null;
}

function normalizeAiRecommendations(aiRecommendations, studies) {
  const usedIds = new Set();
  const recommendations = [];

  aiRecommendations.forEach((item) => {
    if (recommendations.length >= MAX_RECOMMENDATIONS) return;

    const study = findStudyByAiItem(item, studies, usedIds);
    if (!study) return;

    usedIds.add(study.groupId);
    recommendations.push({
      ...study,
      fitScore: normalizeScore(item.fitScore ?? item.score),
      reason: String(item.reason || '프로필과 스터디 요구 기술이 잘 맞습니다.').trim(),
      matchedSkills: splitTags(item.matchedSkills || item.skills),
    });
  });

  return recommendations;
}

function getProfileKeywords(userProfile) {
  return new Set([
    ...userProfile.techStack,
    ...userProfile.interestArea,
    userProfile.department,
  ].filter(Boolean).map(item => item.toLowerCase()));
}

function buildLocalRecommendations(userProfile, studies) {
  const profileKeywords = getProfileKeywords(userProfile);

  return studies
    .map((study) => {
      const matchedSkills = study.techStack.filter(skill => profileKeywords.has(skill.toLowerCase()));
      const scoreGap = Math.max(0, Number(study.requiredRating || 0) - userProfile.scores.total);
      const fitScore = Math.max(55, 88 + matchedSkills.length * 4 - Math.ceil(scoreGap / 100));

      return {
        ...study,
        fitScore: normalizeScore(fitScore),
        matchedSkills,
        reason: matchedSkills.length > 0
          ? `${matchedSkills.join(', ')} 역량과 맞아 바로 참여하기 좋은 스터디입니다.`
          : '현재 프로필과 모집 조건을 기준으로 참여 가능성이 높은 스터디입니다.',
      };
    })
    .sort((left, right) => right.fitScore - left.fitScore)
    .slice(0, MAX_RECOMMENDATIONS);
}

async function recommendStudiesForUser(userId) {
  const [user, studies] = await Promise.all([
    getRecommendationUser(userId),
    communityService.getCommunityRecruitments('STUDY', {
      status: 'recruiting',
      limit: 50,
    }),
  ]);

  if (!user) {
    throw createHttpError(404, '사용자를 찾을 수 없습니다.');
  }

  if (studies.length === 0) {
    return [];
  }

  const userProfile = toUserProfile(user);
  const aiRecommendations = await callGemini(buildPrompt(userProfile, studies));
  const normalizedRecommendations = normalizeAiRecommendations(aiRecommendations, studies);

  return normalizedRecommendations.length > 0
    ? normalizedRecommendations
    : buildLocalRecommendations(userProfile, studies);
}

module.exports = {
  recommendStudiesForUser,
};
