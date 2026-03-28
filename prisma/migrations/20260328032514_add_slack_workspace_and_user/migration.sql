-- CreateTable
CREATE TABLE "SlackWorkspace" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "botToken" TEXT NOT NULL,
    "botUserId" TEXT,
    "installedByUserId" TEXT,
    "installedByName" TEXT,
    "signingSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlackUser" (
    "id" TEXT NOT NULL,
    "slackUserId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "displayName" TEXT,
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlackWorkspace_teamId_key" ON "SlackWorkspace"("teamId");

-- CreateIndex
CREATE INDEX "SlackWorkspace_teamId_idx" ON "SlackWorkspace"("teamId");

-- CreateIndex
CREATE INDEX "SlackUser_teamId_idx" ON "SlackUser"("teamId");

-- CreateIndex
CREATE INDEX "SlackUser_trialEndsAt_idx" ON "SlackUser"("trialEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "SlackUser_slackUserId_teamId_key" ON "SlackUser"("slackUserId", "teamId");

-- AddForeignKey
ALTER TABLE "SlackUser" ADD CONSTRAINT "SlackUser_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SlackWorkspace"("teamId") ON DELETE RESTRICT ON UPDATE CASCADE;
