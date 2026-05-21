-- AlterTable
ALTER TABLE "UserActivityStats"
ADD COLUMN "githubPublicRepoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "bojRank" INTEGER,
ADD COLUMN "dreamhackContributionLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "dreamhackContributionRank" INTEGER;

-- CreateTable
CREATE TABLE "UserScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "githubScore" INTEGER NOT NULL DEFAULT 0,
    "bojScore" INTEGER NOT NULL DEFAULT 0,
    "dreamhackScore" INTEGER NOT NULL DEFAULT 0,
    "algorithmScore" INTEGER NOT NULL DEFAULT 0,
    "securityScore" INTEGER NOT NULL DEFAULT 0,
    "implementationScore" INTEGER NOT NULL DEFAULT 0,
    "collaborationScore" INTEGER NOT NULL DEFAULT 0,
    "problemSolvingScore" INTEGER NOT NULL DEFAULT 0,
    "activityScore" INTEGER NOT NULL DEFAULT 0,
    "fieldRawScores" JSONB NOT NULL,
    "fieldDisplayScores" JSONB NOT NULL,
    "scoreVersion" TEXT NOT NULL DEFAULT '2026-06-02-v1',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserScoreSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "githubScore" INTEGER NOT NULL DEFAULT 0,
    "bojScore" INTEGER NOT NULL DEFAULT 0,
    "dreamhackScore" INTEGER NOT NULL DEFAULT 0,
    "algorithmScore" INTEGER NOT NULL DEFAULT 0,
    "securityScore" INTEGER NOT NULL DEFAULT 0,
    "implementationScore" INTEGER NOT NULL DEFAULT 0,
    "collaborationScore" INTEGER NOT NULL DEFAULT 0,
    "problemSolvingScore" INTEGER NOT NULL DEFAULT 0,
    "activityScore" INTEGER NOT NULL DEFAULT 0,
    "fieldRawScores" JSONB NOT NULL,
    "fieldDisplayScores" JSONB NOT NULL,
    "rankOverall" INTEGER,
    "rankDepartment" INTEGER,
    "scoreDelta" INTEGER NOT NULL DEFAULT 0,
    "rankDelta" INTEGER,
    "scoreVersion" TEXT NOT NULL DEFAULT '2026-06-02-v1',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserScore_userId_key" ON "UserScore"("userId");

-- CreateIndex
CREATE INDEX "UserScoreSnapshot_userId_calculatedAt_idx" ON "UserScoreSnapshot"("userId", "calculatedAt");

-- CreateIndex
CREATE INDEX "UserScoreSnapshot_totalScore_idx" ON "UserScoreSnapshot"("totalScore");

-- AddForeignKey
ALTER TABLE "UserScore" ADD CONSTRAINT "UserScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserScoreSnapshot" ADD CONSTRAINT "UserScoreSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
