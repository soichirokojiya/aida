/*
  Warnings:

  - You are about to drop the column `linkedLineUserId` on the `SlackUser` table. All the data in the column will be lost.
  - You are about to drop the `LinkCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "SlackUser_linkedLineUserId_idx";

-- AlterTable
ALTER TABLE "SlackUser" DROP COLUMN "linkedLineUserId",
ADD COLUMN     "trialReminderSent" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "LinkCode";

-- CreateTable
CREATE TABLE "SlackDmSubscription" (
    "id" TEXT NOT NULL,
    "slackUserId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackDmSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlackChannelSubscription" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "payerSlackUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackChannelSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SlackDmSubscription_status_idx" ON "SlackDmSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SlackDmSubscription_slackUserId_teamId_key" ON "SlackDmSubscription"("slackUserId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "SlackChannelSubscription_channelId_key" ON "SlackChannelSubscription"("channelId");

-- CreateIndex
CREATE INDEX "SlackChannelSubscription_channelId_idx" ON "SlackChannelSubscription"("channelId");

-- CreateIndex
CREATE INDEX "SlackChannelSubscription_payerSlackUserId_idx" ON "SlackChannelSubscription"("payerSlackUserId");

-- CreateIndex
CREATE INDEX "SlackChannelSubscription_status_idx" ON "SlackChannelSubscription"("status");

-- AddForeignKey
ALTER TABLE "SlackDmSubscription" ADD CONSTRAINT "SlackDmSubscription_slackUserId_teamId_fkey" FOREIGN KEY ("slackUserId", "teamId") REFERENCES "SlackUser"("slackUserId", "teamId") ON DELETE RESTRICT ON UPDATE CASCADE;
