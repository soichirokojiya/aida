-- AlterTable
ALTER TABLE "LineUser" ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "unfollowedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LlmUsage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "messageId" TEXT,
    "purpose" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LlmUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LlmUsage_createdAt_idx" ON "LlmUsage"("createdAt");

-- CreateIndex
CREATE INDEX "LlmUsage_purpose_idx" ON "LlmUsage"("purpose");
