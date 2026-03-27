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

  await prisma.lineUser.upsert({
    where: { lineUserId: userId },
    update: {}, // Don't reset if they re-follow
    create: {
      lineUserId: userId,
      trialEndsAt,
      billingStatus: "trial",
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

  // Handle follow events
  for (const rawEvent of body.events as RawLineEvent[]) {
    if (rawEvent.type === "follow") {
      try {
        await handleFollow(rawEvent);
      } catch (err) {
        console.error("Error handling follow:", err);
      }
    }
  }

  // Handle message events
  const events = lineAdapter.normalizeEvents(body);
  for (const event of events) {
    try {
      await processMessage(event, lineAdapter);
    } catch (err) {
      console.error("Error processing message:", err);
    }
  }

  return NextResponse.json({ status: "ok" });
}
