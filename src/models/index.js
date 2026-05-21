/**
 * UML 클래스 다이어그램 기반 데이터 모델 & 목 데이터
 * MatchingEngine, User, Rating, StudyGroup, Project, Message, Notification
 */

import { addDaysToDateKey, toKoreanDateKey } from '../utils/koreanTime'

// ─── User ───────────────────────────────────────────────────────────────────
export const mockUser = {
  userId: 'user_001',
  nickname: 'Hong Gil-dong',
  department: 'Computer Science',
  interestArea: 'Algorithm, Web Backend',
  techStack: 'Java, Spring, React',
  profileImage: null,
  oneLiner: '알고리즘과 백엔드를 사랑하는 개발자',
  year: 3,
  university: 'Dankook University',
}

// ─── Rating ─────────────────────────────────────────────────────────────────
export const mockRating = {
  userId: 'user_001',
  githubCommitCount: 342,
  baekjoonTier: 'Gold IV',
  dreamhackScore: 0,
  dreamhackSolvedCount: 0,
  totalRatingScore: 1200,
  // calculateTotalRating(): GitHub + BOJ + Dreamhack backend score formula
  history: [
    { month: 'Jan', score: 820 },
    { month: 'Feb', score: 900 },
    { month: 'Mar', score: 950 },
    { month: 'Apr', score: 980 },
    { month: 'May', score: 1020 },
    { month: 'Jun', score: 1050 },
    { month: 'Jul', score: 1100 },
    { month: 'Aug', score: 1080 },
    { month: 'Sep', score: 1120 },
    { month: 'Oct', score: 1150 },
    { month: 'Nov', score: 1180 },
    { month: 'Dec', score: 1200 },
  ],
}

// ─── Field Stats (레이더 차트용) ─────────────────────────────────────────────
export const mockFieldStats = {
  userId: 'user_001',
  algorithm: 80,
  security: 65,
  implementation: 60,
  collaboration: 70,
  problemSolving: 85,
  activity: 75,
}

// ─── StudyGroup ──────────────────────────────────────────────────────────────
export const mockStudyGroups = [
  {
    groupId: 'sg_001',
    leaderId: 'user_002',
    leaderName: 'Kim Chul-su',
    title: '알고리즘 스터디 - 코딩테스트 완전정복',
    description: '매주 3회 백준 문제풀이 및 코드리뷰를 진행합니다.',
    requiredRating: 800,
    capacity: 6,
    currentCount: 4,
    techStack: ['Algorithm', 'C++', 'Python'],
    applicantList: [],
    status: 'recruiting',
    createdAt: '2026-04-10',
  },
  {
    groupId: 'sg_002',
    leaderId: 'user_003',
    leaderName: 'Lee Young-hee',
    title: 'Spring Boot + JPA 백엔드 스터디',
    description: 'Spring Boot와 JPA를 활용한 실전 프로젝트 중심 스터디',
    requiredRating: 1000,
    capacity: 5,
    currentCount: 3,
    techStack: ['Java', 'Spring Boot', 'JPA'],
    applicantList: [],
    status: 'recruiting',
    createdAt: '2026-04-15',
  },
  {
    groupId: 'sg_003',
    leaderId: 'user_004',
    leaderName: 'Park Min-jun',
    title: 'React + TypeScript 프론트엔드 스터디',
    description: '모던 프론트엔드 기술 스택을 함께 공부합니다.',
    requiredRating: 900,
    capacity: 4,
    currentCount: 4,
    techStack: ['React', 'TypeScript', 'TailwindCSS'],
    applicantList: [],
    status: 'closed',
    createdAt: '2026-03-20',
  },
]

// ─── Project ─────────────────────────────────────────────────────────────────
export const mockProjects = [
  {
    projectId: 'proj_001',
    leaderId: 'user_005',
    leaderName: 'Choi Da-eun',
    title: '단국대 식단 알리미 앱 개발',
    description: '학식 메뉴를 자동으로 파싱하고 알림을 보내주는 앱',
    requiredRating: 1000,
    capacity: 4,
    currentCount: 2,
    techStack: ['React Native', 'Node.js', 'MongoDB'],
    applicantList: [],
    status: 'recruiting',
    createdAt: '2026-04-20',
  },
  {
    projectId: 'proj_002',
    leaderId: 'user_006',
    leaderName: 'Jung Woo-jin',
    title: '스터디 매칭 플랫폼 Link-U 고도화',
    description: 'AI 기반 스터디 추천 기능 개발 및 UI 개선',
    requiredRating: 1100,
    capacity: 5,
    currentCount: 3,
    techStack: ['React', 'Spring Boot', 'Python', 'PostgreSQL'],
    applicantList: [],
    status: 'recruiting',
    createdAt: '2026-05-01',
  },
]

// ─── Message ─────────────────────────────────────────────────────────────────
export const mockMessages = [
  {
    messageId: 'msg_001',
    senderId: 'user_002',
    senderName: 'Kim Chul-su',
    receiverId: 'user_001',
    content: '안녕하세요! 알고리즘 스터디에 관심 있으신가요?',
    createdAt: '2026-05-10 14:23',
    isRead: false,
  },
  {
    messageId: 'msg_002',
    senderId: 'user_003',
    senderName: 'Lee Young-hee',
    receiverId: 'user_001',
    content: '스터디 지원해 주셔서 감사합니다. 승인 완료되었습니다!',
    createdAt: '2026-05-09 09:10',
    isRead: true,
  },
  {
    messageId: 'msg_003',
    senderId: 'user_001',
    senderName: 'Hong Gil-dong',
    receiverId: 'user_005',
    content: '프로젝트 참여 관련해서 여쭤볼게 있어요.',
    createdAt: '2026-05-08 18:45',
    isRead: true,
  },
]

// ─── Notification ─────────────────────────────────────────────────────────────
export const mockNotifications = [
  {
    notificationId: 'noti_001',
    receiverId: 'user_001',
    type: 'STUDY_RESULT',
    content: '알고리즘 스터디 지원 결과: 승인되었습니다.',
    isRead: false,
    metadata: {
      recruitmentId: 'sg_001',
    },
    createdAt: '2026-05-11 10:00',
  },
  {
    notificationId: 'noti_002',
    receiverId: 'user_001',
    type: 'RANKING_CHANGE',
    content: '랭킹이 15위 상승했습니다! 현재 전체 42위입니다.',
    isRead: false,
    metadata: {},
    createdAt: '2026-05-10 00:00',
  },
  {
    notificationId: 'noti_003',
    receiverId: 'user_001',
    type: 'PROJECT_RESULT',
    content: '식단 알리미 앱 프로젝트 지원 결과: 검토 중입니다.',
    isRead: true,
    metadata: {
      recruitmentId: 'proj_001',
    },
    createdAt: '2026-05-09 15:30',
  },
  {
    notificationId: 'noti_004',
    receiverId: 'user_001',
    type: 'SYSTEM',
    content: '시스템 점검 안내: 5월 15일 02:00 ~ 04:00',
    isRead: true,
    metadata: {},
    createdAt: '2026-05-08 09:00',
  },
]

// ─── Ranking (전체 / 학과) ────────────────────────────────────────────────────
export const mockRankingList = [
  { rank: 1,  userId: 'u10', nickname: 'dev_master',   department: 'Computer Science', score: 2100, tier: 'Diamond' },
  { rank: 2,  userId: 'u11', nickname: 'algo_king',    department: 'Software Eng.',    score: 2050, tier: 'Diamond' },
  { rank: 3,  userId: 'u12', nickname: 'backend_pro',  department: 'Computer Science', score: 1980, tier: 'Platinum' },
  { rank: 4,  userId: 'u13', nickname: 'fullstack_1',  department: 'AI Convergence',   score: 1870, tier: 'Platinum' },
  { rank: 5,  userId: 'u14', nickname: 'clean_coder',  department: 'Computer Science', score: 1800, tier: 'Platinum' },
  { rank: 42, userId: 'user_001', nickname: 'Hong Gil-dong', department: 'Computer Science', score: 1200, tier: 'Gold' },
]

// ─── Commit Activity (잔디용 — 최근 24주 샘플) ────────────────────────────────
function generateGrass(weeks = 24) {
  const todayKey = toKoreanDateKey()

  return Array.from({ length: weeks * 7 }, (_, i) => ({
    date: addDaysToDateKey(todayKey, i - weeks * 7 + 1),
    github: Math.floor(Math.random() * 8),
    baekjoon: Math.floor(Math.random() * 5),
    dreamhack: Math.floor(Math.random() * 4),
  }))
}
export const mockCommitData = generateGrass(24)
