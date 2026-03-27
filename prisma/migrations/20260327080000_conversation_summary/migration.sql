CREATE TABLE IF NOT EXISTS "ConversationSummary" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "messagesCount" INTEGER NOT NULL,
    "messageRangeEnd" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationSummary_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ConversationSummary_conversationId_version_idx" ON "ConversationSummary"("conversationId", "version");

ALTER TABLE "ConversationSummary" ADD CONSTRAINT "ConversationSummary_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
