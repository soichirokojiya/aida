import { NextRequest, NextResponse } from "next/server";
import { slackAdapter, verifySlackRequest, parseSlackPayload } from "@/lib/channels/slack";
import { processMessage } from "@/lib/channels/pipeline";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") || "";
  const signature = request.headers.get("x-slack-signature") || "";

  // Verify Slack signature
  if (!verifySlackRequest(rawBody, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const payload = parseSlackPayload(body);

  // Handle URL verification challenge
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Handle events
  if (payload.type === "event_callback" && payload.event) {
    const events = slackAdapter.normalizeEvents(body);

    for (const event of events) {
      const start = Date.now();
      try {
        console.log(`Slack: Processing ${event.isDirectMessage ? "DM" : "Channel"} from ${event.senderId.slice(0, 8)}`);
        await processMessage(event, slackAdapter);
        console.log(`Slack: Done ${Date.now() - start}ms`);
      } catch (err) {
        console.error(`Slack: Error after ${Date.now() - start}ms:`, err instanceof Error ? err.stack : err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
