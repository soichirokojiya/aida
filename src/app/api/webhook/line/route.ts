import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { lineAdapter } from "@/lib/channels/line";
import { processMessage } from "@/lib/channels/pipeline";
import { prisma } from "@/lib/db/prisma";
import { getWelcomeMessage } from "@/lib/billing/messages";

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

  const existing = await prisma.lineUser.findUnique({ where: { lineUserId: userId } });

  if (existing) {
    // Re-follow: clear unfollow, reset trial if not already paid
    await prisma.lineUser.update({
      where: { lineUserId: userId },
      data: {
        unfollowedAt: null,
        ...(existing.billingStatus === "active" ? {} : { billingStatus: "trial", trialEndsAt }),
      },
    });
  } else {
    await prisma.lineUser.create({
      data: {
        lineUserId: userId,
        trialEndsAt,
        billingStatus: "trial",
      },
    });
  }

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

  // Handle message events
  const events = lineAdapter.normalizeEvents(body);
  for (const event of events) {
    try {
      await processMessage(event, lineAdapter);
    } catch (err) {
      console.error("Error processing message:", err instanceof Error ? err.stack : err);
    }
  }

  return NextResponse.json({ status: "ok" });
}
