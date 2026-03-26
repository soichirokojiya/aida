import { NextRequest, NextResponse } from "next/server";
import { lineAdapter } from "@/lib/channels/line";
import { processMessage } from "@/lib/channels/pipeline";

export async function POST(request: NextRequest) {
  // Validate LINE signature
  const isValid = await lineAdapter.validateRequest(request);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = await request.json();

  // Process each message event
  const events = lineAdapter.normalizeEvents(body);

  // Process in background - respond to LINE quickly
  for (const event of events) {
    // Don't await - process async to avoid LINE webhook timeout
    processMessage(event, lineAdapter).catch((err) => {
      console.error("Error processing message:", err);
    });
  }

  return NextResponse.json({ status: "ok" });
}
