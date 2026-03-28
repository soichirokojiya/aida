import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { lineAdapter, enrichLineEvent } from "@/lib/channels/line";
import { processMessage } from "@/lib/channels/pipeline";
import { prisma } from "@/lib/db/prisma";


interface RawLineEvent {
  type: string;
  source?: { userId?: string };
  replyToken?: string;
}

function validateSignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET || "";
  if (!secret) return false;
  const hash = crypto
    .createHmac("SHA256", secret)
    .update(body)
    .digest();
  const sigBuf = Buffer.from(signature, "base64");
  if (hash.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(hash, sigBuf);
}

async function handleFollow(event: RawLineEvent) {
  const userId = event.source?.userId;
  if (!userId) return;

  const trialDays = 30;
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

  await prisma.lineUser.upsert({
    where: { lineUserId: userId },
    update: { unfollowedAt: null },
    create: {
      lineUserId: userId,
      trialEndsAt,
    },
  });

  // Save welcome message context to DB so うめこ remembers it
  const welcomeText = `はじめまして、うめこです。ことばに迷ったとき、ちょっとだけお手伝いします。グループに招待してもらえれば、ふだんは静かにしてるけど、会話がちょっとピリッとしてきたら声をかけるね。話しかけたいときは「うめこ」って名前を入れてくれれば、いつでも気づきます。1対1でも気軽に話しかけてね。最初の1ヶ月は無料で使えます。`;

  const conversation = await prisma.conversation.upsert({
    where: {
      channelType_externalThreadId: {
        channelType: "line",
        externalThreadId: userId,
      },
    },
    update: {},
    create: {
      channelType: "line",
      externalThreadId: userId,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: "umeko-bot",
      senderRole: "bot",
      senderDisplayName: "うめこ",
      text: welcomeText,
      timestamp: new Date(),
      detectedIntent: "normal",
      conflictScore: 0,
    },
  });

  // Welcome message is handled by LINE Official Account's greeting message
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") || "";

  if (!validateSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  if (!body.events || body.events.length === 0) {
    return NextResponse.json({ status: "ok" });
  }

  // Handle follow/unfollow events
  for (const rawEvent of body.events as RawLineEvent[]) {
    try {
      if (rawEvent.type === "follow") {
        await handleFollow(rawEvent);
      } else if (rawEvent.type === "unfollow" && rawEvent.source?.userId) {
        await prisma.lineUser.updateMany({
          where: { lineUserId: rawEvent.source.userId },
          data: { unfollowedAt: new Date() },
        });
      }
    } catch (err) {
      console.error("Error handling event:", err);
    }
  }

  // Handle message events (text, image, audio)
  const rawEvents = lineAdapter.normalizeEvents(body);
  for (const rawEvent of rawEvents) {
    const start = Date.now();
    try {
      // Fetch image/audio content from LINE Content API
      const event = await enrichLineEvent(rawEvent);
      console.log(`Processing: ${event.isDirectMessage ? "DM" : "Group"} from ${event.senderId.slice(0, 8)} [${event.imageUrls ? "image" : event.audioUrl ? "audio" : "text"}]`);
      await processMessage(event, lineAdapter);
      console.log(`Done: ${Date.now() - start}ms`);
    } catch (err) {
      console.error(`Error after ${Date.now() - start}ms:`, err instanceof Error ? err.stack : err);
    }
  }

  return NextResponse.json({ status: "ok" });
}
