# 🔗 LINK_U

> 단국대학교 IT계열 학생을 위한 **역량 기반 팀 빌딩 플랫폼**

---

## 🧭 소개

해커톤이나 수업 프로젝트에서 팀을 꾸릴 때, 기술보다 **친분**이 기준이 되는 경우가 많다.

LINK_U는 GitHub 커밋 이력, 백준 풀이 현황 등 **이미 존재하는 개발 활동 데이터**를 수집해 각 학생의 역량 프로필을 자동으로 구성하고, 이를 바탕으로 **기술 적합도 기반 팀 매칭**을 제공한다. 단국대학교 `@dankook.ac.kr` 계정 소지자만 가입 가능한 교내 전용 서비스다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| **통합 역량 프로필** | GitHub·BOJ 데이터를 수집해 도메인별 강점을 레이더 차트로 시각화 |
| **랭킹 시스템** | 비선형 가중치 알고리즘으로 통합 점수·티어 산출, 전교·학과별 순위 제공 |
| **스터디 / 프로젝트 매칭** | 기술 스택·역할 조건 입력 시 역량 벡터 유사도 기반 후보 자동 추천 |
| **하드 필터링** | 모집 조건 미달 지원자를 시스템 단에서 자동 차단 |
| **통합 잔디** | GitHub·BOJ·드림핵 3개 플랫폼 활동 내역을 하나의 캘린더 히트맵으로 표시 |
| **네트워킹** | 랭킹 페이지에서 다른 유저 탐색 후 쪽지로 스터디·프로젝트 제안 |

---

## 🏗️ 아키텍처

```
┌──────────────────────────────────────┐
│           React SPA (Client)         │
│     Chart.js · Dynamic Routing       │
└───────────────┬──────────────────────┘
                │ REST API (JSON)
┌───────────────▼──────────────────────┐
│        Node.js / Express (Server)    │
│                                      │
│  ┌─────────────┐  ┌───────────────┐  │
│  │ Google OAuth│  │ Ranking Engine│  │
│  │ @dankook 제한│  │ 비선형 가중치  │  │
│  └─────────────┘  └───────────────┘  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │        Data Pipeline         │    │
│  │  GitHub API  │  BOJ Crawling │    │
│  │       node-cron Batch        │    │
│  └──────────────────────────────┘    │
└───────────────┬──────────────────────┘
                │
┌───────────────▼──────────────────────┐
│         MongoDB / PostgreSQL         │
└──────────────────────────────────────┘

Docker Compose로 Front · Back · DB 컨테이너화 → Linux 서버 배포
```

---

## 🛠️ 기술 스택

| 구분 | 스택 |
|------|------|
| Frontend | React.js, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB / PostgreSQL |
| 인증 | Google OAuth 2.0 |
| 크롤링 | Axios, Cheerio, Puppeteer |
| 외부 API | GitHub REST API |
| 스케줄러 | node-cron |
| 배포 | Docker, Docker Compose |

---

## 📁 프로젝트 구조

```
link-u/
├── client/               # React 프론트엔드
│   ├── src/
│   │   ├── components/   # 공통 컴포넌트 (레이더 차트, 잔디 등)
│   │   ├── pages/        # 라우팅 단위 페이지
│   │   └── store/        # 상태 관리
├── server/               # Express 백엔드
│   ├── routes/           # API 라우터
│   ├── controllers/      # 비즈니스 로직
│   ├── crawlers/         # 플랫폼별 크롤링 모듈
│   ├── ranking/          # 점수 산출 알고리즘
│   └── scheduler/        # node-cron 배치 작업
├── docker-compose.yml
└── README.md
```

---

## 🚀 로컬 실행

### 사전 요구사항
- Node.js 18+
- Docker & Docker Compose

### 실행

```bash
# 저장소 클론
git clone https://github.com/your-org/link-u.git
cd link-u

# 환경 변수 설정
cp .env.example .env
# .env 파일에 Google OAuth, GitHub API, DB 연결 정보 입력

# Docker로 전체 실행
docker-compose up --build
```

접속: `http://localhost:3000`

---

## ⚙️ 환경 변수

```env
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub API
GITHUB_TOKEN=

# Database
DB_HOST=
DB_PORT=
DB_NAME=

# JWT
JWT_SECRET=
```

---

## 👥 팀원

| 이름 | 학과 | 학번 | 역할 |
|------|------|------|------|
| 박종성 | 모바일시스템공학과 | 32221890 | Back 1 · 아키텍처 & 인프라 |
| 김정현 | 모바일시스템공학과 | 32221084 | Back 2 · 데이터 파이프라인 & 랭킹 엔진 |
| 김준엽 | 모바일시스템공학과 | 32221129 | Front 1 · 시각화 & 대시보드 |
| 심연호 | 소프트웨어학과 | 32252449 | Front 2 · 라우팅 & 상태 관리 |

---

## 📅 개발 일정

| 주차 | 내용 |
|------|------|
| 1 – 4주 | 요구사항 정의, 와이어프레임, DB 스키마 설계 |
| 5 – 8주 | 백엔드 API 서버 구축, 크롤링 모듈 개발 |
| 9 – 12주 | 랭킹 로직 적용, 프론트엔드 연동 |
| 13 – 14주 | Docker 배포, 버그 픽스, 최종 발표 |
