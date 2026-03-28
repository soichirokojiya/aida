-- AlterTable
ALTER TABLE "SlackUser" ADD COLUMN     "linkedLineUserId" TEXT;

-- CreateTable
CREATE TABLE "LinkCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkCode_code_key" ON "LinkCode"("code");

-- CreateIndex
CREATE INDEX "LinkCode_code_idx" ON "LinkCode"("code");

-- CreateIndex
CREATE INDEX "LinkCode_lineUserId_idx" ON "LinkCode"("lineUserId");

-- CreateIndex
CREATE INDEX "SlackUser_linkedLineUserId_idx" ON "SlackUser"("linkedLineUserId");
