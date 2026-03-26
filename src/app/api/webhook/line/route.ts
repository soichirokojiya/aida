import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { lineAdapter } from "@/lib/channels/line";
import { processMessage } from "@/lib/channels/pipeline";

function validateSignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET || "";
  if (!secret) {
    console.error("LINE_CHANNEL_SECRET is not set");
    return false;
  }
  const hash = crypto
    .createHmac("SHA256", secret)
    .update(body)
    .digest("base64");
  return hash === signature;
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

  const events = lineAdapter.normalizeEvents(body);

  // Must await - Vercel serverless functions terminate after response
  for (const event of events) {
    try {
      await processMessage(event, lineAdapter);
    } catch (err) {
      console.error("Error processing message:", err);
    }
  }

  return NextResponse.json({ status: "ok" });
}
