-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "lineNewUsers" INTEGER NOT NULL DEFAULT 0,
    "lineUnfollows" INTEGER NOT NULL DEFAULT 0,
    "lineTrialUsers" INTEGER NOT NULL DEFAULT 0,
    "lineActiveDmSubs" INTEGER NOT NULL DEFAULT 0,
    "lineActiveGroupSubs" INTEGER NOT NULL DEFAULT 0,
    "lineCanceledDmSubs" INTEGER NOT NULL DEFAULT 0,
    "lineCanceledGroupSubs" INTEGER NOT NULL DEFAULT 0,
    "lineDau" INTEGER NOT NULL DEFAULT 0,
    "slackNewUsers" INTEGER NOT NULL DEFAULT 0,
    "slackWorkspaces" INTEGER NOT NULL DEFAULT 0,
    "slackTrialUsers" INTEGER NOT NULL DEFAULT 0,
    "slackActiveDmSubs" INTEGER NOT NULL DEFAULT 0,
    "slackActiveChannelSubs" INTEGER NOT NULL DEFAULT 0,
    "slackCanceledDmSubs" INTEGER NOT NULL DEFAULT 0,
    "slackCanceledChannelSubs" INTEGER NOT NULL DEFAULT 0,
    "slackDau" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "totalInterventions" INTEGER NOT NULL DEFAULT 0,
    "mrrJpy" INTEGER NOT NULL DEFAULT 0,
    "apiCostJpy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_date_key" ON "DailyMetric"("date");

-- CreateIndex
CREATE INDEX "DailyMetric_date_idx" ON "DailyMetric"("date");
