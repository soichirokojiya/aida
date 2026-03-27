-- AlterTable: Remove old billing columns from LineUser
ALTER TABLE "LineUser" DROP COLUMN IF EXISTS "billingStatus";
ALTER TABLE "LineUser" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "LineUser" DROP COLUMN IF EXISTS "stripeSessionUrl";
ALTER TABLE "LineUser" DROP COLUMN IF EXISTS "lastReminderType";
ALTER TABLE "LineUser" DROP COLUMN IF EXISTS "lastReminderAt";

-- AddColumn: trialReminderSent
ALTER TABLE "LineUser" ADD COLUMN IF NOT EXISTS "trialReminderSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: DmSubscription
CREATE TABLE IF NOT EXISTS "DmSubscription" (
    "id" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DmSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GroupSubscription
CREATE TABLE IF NOT EXISTS "GroupSubscription" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "payerLineUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroupSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DmSubscription_lineUserId_key" ON "DmSubscription"("lineUserId");
CREATE INDEX IF NOT EXISTS "DmSubscription_status_idx" ON "DmSubscription"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "GroupSubscription_groupId_key" ON "GroupSubscription"("groupId");
CREATE INDEX IF NOT EXISTS "GroupSubscription_groupId_idx" ON "GroupSubscription"("groupId");
CREATE INDEX IF NOT EXISTS "GroupSubscription_payerLineUserId_idx" ON "GroupSubscription"("payerLineUserId");
CREATE INDEX IF NOT EXISTS "GroupSubscription_status_idx" ON "GroupSubscription"("status");

-- AddForeignKey
ALTER TABLE "DmSubscription" ADD CONSTRAINT "DmSubscription_lineUserId_fkey" FOREIGN KEY ("lineUserId") REFERENCES "LineUser"("lineUserId") ON DELETE RESTRICT ON UPDATE CASCADE;
