import { NextRequest, NextResponse } from "next/server";
import { createSlackAdapter, verifySlackRequest, trackSlackUser, getBotUserIdForTeam, enrichSlackEvent } from "@/lib/channels/slack";
import { processMessage } from "@/lib/channels/pipeline";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

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
      return NextResponse.json({ ok: true });
    }

    // Handle events
    if (body.type === "event_callback" && body.event) {
      const teamId = body.team_id || "__legacy__";

      console.log("Slack event:", JSON.stringify({
        type: body.event.type,
        user: body.event.user,
        bot_id: body.event.bot_id,
        subtype: body.event.subtype,
        text: body.event.text?.slice(0, 50),
        channel: body.event.channel,
        channel_type: body.event.channel_type,
        team_id: teamId,
      }));

      // Skip messages from our own bot
      if (body.event.bot_id) {
        return NextResponse.json({ ok: true });
      }
      const botUserId = await getBotUserIdForTeam(teamId);
      if (botUserId && body.event.user === botUserId) {
        return NextResponse.json({ ok: true });
      }

      const adapter = createSlackAdapter(teamId);
      const events = adapter.normalizeEvents(body);

      for (const event of events) {
        const start = Date.now();
        try {
          // Track Slack user (non-blocking)
          trackSlackUser(event.senderId, teamId).catch(() => {});

          // Enrich with file content (images, audio, PDF)
          const enriched = await enrichSlackEvent(event);
          console.log(`Slack[${teamId}]: Processing ${enriched.isDirectMessage ? "DM" : "Channel"} text="${enriched.text.slice(0, 30)}" [${enriched.imageUrls ? "image" : enriched.audioUrl ? "audio" : "text"}]`);
          await processMessage(enriched, adapter);
          console.log(`Slack[${teamId}]: Done ${Date.now() - start}ms`);
        } catch (err) {
          console.error(`Slack[${teamId}]: Error after ${Date.now() - start}ms:`, err instanceof Error ? err.message : err);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack webhook error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
