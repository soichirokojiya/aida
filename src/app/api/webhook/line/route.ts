import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { lineAdapter } from "@/lib/channels/line";
import { processMessage } from "@/lib/channels/pipeline";

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";

function validateSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("SHA256", LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") || "";

  // Validate LINE signature
  if (!validateSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // LINE verification request sends empty events
  if (!body.events || body.events.length === 0) {
    return NextResponse.json({ status: "ok" });
  }

  // Process each message event
  const events = lineAdapter.normalizeEvents(body);

  for (const event of events) {
    processMessage(event, lineAdapter).catch((err) => {
      console.error("Error processing message:", err);
    });
  }

  return NextResponse.json({ status: "ok" });
}
