-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupMembership_lineUserId_idx" ON "GroupMembership"("lineUserId");

-- CreateIndex
CREATE INDEX "GroupMembership_groupId_idx" ON "GroupMembership"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_lineUserId_groupId_key" ON "GroupMembership"("lineUserId", "groupId");
