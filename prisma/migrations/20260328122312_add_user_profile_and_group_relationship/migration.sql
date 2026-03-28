-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "displayName" TEXT,
    "personality" TEXT,
    "topics" TEXT,
    "preferences" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupRelationship" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "members" JSONB,
    "relationships" JSONB,
    "groupNorms" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_channelType_idx" ON "UserProfile"("channelType");

-- CreateIndex
CREATE UNIQUE INDEX "GroupRelationship_conversationId_key" ON "GroupRelationship"("conversationId");

-- CreateIndex
CREATE INDEX "GroupRelationship_conversationId_idx" ON "GroupRelationship"("conversationId");

-- AddForeignKey
ALTER TABLE "GroupRelationship" ADD CONSTRAINT "GroupRelationship_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
