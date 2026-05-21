-- CreateTable
CREATE TABLE "UserRatingHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordedDate" TIMESTAMP(3) NOT NULL,
    "totalRatingScore" INTEGER NOT NULL DEFAULT 0,
    "githubCommitCount" INTEGER NOT NULL DEFAULT 0,
    "githubPrCount" INTEGER NOT NULL DEFAULT 0,
    "bojSolvedCount" INTEGER NOT NULL DEFAULT 0,
    "bojTierNumber" INTEGER,
    "bojRating" INTEGER,
    "dreamhackScore" INTEGER NOT NULL DEFAULT 0,
    "dreamhackSolvedCount" INTEGER NOT NULL DEFAULT 0,
    "dreamhackRank" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRatingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRatingHistory_userId_recordedDate_key" ON "UserRatingHistory"("userId", "recordedDate");

-- CreateIndex
CREATE INDEX "UserRatingHistory_userId_recordedAt_idx" ON "UserRatingHistory"("userId", "recordedAt");

-- AddForeignKey
ALTER TABLE "UserRatingHistory" ADD CONSTRAINT "UserRatingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
