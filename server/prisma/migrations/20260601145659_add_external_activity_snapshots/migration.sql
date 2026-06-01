-- CreateEnum
CREATE TYPE "ExternalPlatform" AS ENUM ('GITHUB', 'BOJ', 'DREAMHACK');

-- CreateEnum
CREATE TYPE "ActivitySyncStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "ExternalActivitySnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "ExternalPlatform" NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" "ActivitySyncStatus" NOT NULL DEFAULT 'SUCCESS',
    "rawData" JSONB,
    "summary" JSONB,
    "errorMessage" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalActivitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivityStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "githubCommitCount" INTEGER NOT NULL DEFAULT 0,
    "githubPrCount" INTEGER NOT NULL DEFAULT 0,
    "bojSolvedCount" INTEGER NOT NULL DEFAULT 0,
    "bojTierNumber" INTEGER,
    "bojRating" INTEGER,
    "dreamhackScore" INTEGER NOT NULL DEFAULT 0,
    "dreamhackSolvedCount" INTEGER NOT NULL DEFAULT 0,
    "dreamhackRank" INTEGER,
    "totalRatingScore" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserActivityStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalActivitySnapshot_userId_platform_syncedAt_idx" ON "ExternalActivitySnapshot"("userId", "platform", "syncedAt");

-- CreateIndex
CREATE INDEX "ExternalActivitySnapshot_platform_accountId_idx" ON "ExternalActivitySnapshot"("platform", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "UserActivityStats_userId_key" ON "UserActivityStats"("userId");

-- AddForeignKey
ALTER TABLE "ExternalActivitySnapshot" ADD CONSTRAINT "ExternalActivitySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivityStats" ADD CONSTRAINT "UserActivityStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
