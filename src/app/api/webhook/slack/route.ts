import { NextRequest, NextResponse } from "next/server";
import { slackAdapter, verifySlackRequest } from "@/lib/channels/slack";
import { processMessage } from "@/lib/channels/pipeline";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Log incoming payload type
    console.log("Slack webhook received:", body.type, body.event?.type || "no event");

    // Handle URL verification challenge
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Verify Slack signature
    const timestamp = request.headers.get("x-slack-request-timestamp") || "";
    const signature = request.headers.get("x-slack-signature") || "";

    if (signature && !verifySlackRequest(rawBody, timestamp, signature)) {
      console.log("Slack: signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Ignore retry requests from Slack
    if (request.headers.get("x-slack-retry-num")) {
      console.log("Slack: ignoring retry");
      return NextResponse.json({ ok: true });
    }

    // Handle events
    if (body.type === "event_callback" && body.event) {
      // Ignore bot messages
      if (body.event.bot_id || body.event.subtype) {
        console.log("Slack: ignoring bot/subtype message");
        return NextResponse.json({ ok: true });
      }

      const events = slackAdapter.normalizeEvents(body);
      console.log("Slack: normalized", events.length, "events");

      for (const event of events) {
        const start = Date.now();
        try {
          console.log(`Slack: Processing ${event.isDirectMessage ? "DM" : "Channel"} text="${event.text.slice(0, 30)}"`);
          await processMessage(event, slackAdapter);
          console.log(`Slack: Done ${Date.now() - start}ms`);
        } catch (err) {
          console.error(`Slack: Error after ${Date.now() - start}ms:`, err instanceof Error ? err.message : err);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack webhook error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Internal Server Error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
