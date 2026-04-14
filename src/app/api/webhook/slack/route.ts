import { NextRequest, NextResponse } from "next/server";
import { createSlackAdapter, verifySlackRequest, trackSlackUser, getBotUserIdForTeam, enrichSlackEvent } from "@/lib/channels/slack";
import { processMessage } from "@/lib/channels/pipeline";

export const maxDuration = 60;

// In-memory dedup for Slack events. message + app_mention fire two separate
// webhooks for the same user message; both share event.ts, so we collapse them.
// Survives within a warm Lambda; cold starts may leak one dupe (acceptable).
const recentEventKeys = new Map<string, number>();
const DEDUP_TTL_MS = 5 * 60 * 1000;

function isDuplicateSlackEvent(key: string): boolean {
  const now = Date.now();
  for (const [k, t] of recentEventKeys) {
    if (now - t > DEDUP_TTL_MS) recentEventKeys.delete(k);
  }
  if (recentEventKeys.has(key)) return true;
  recentEventKeys.set(key, now);
  return false;
}

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
        const dedupKey = `${teamId}:${event.externalThreadId}:${event.externalMessageId}`;
        if (isDuplicateSlackEvent(dedupKey)) {
          console.log(`Slack[${teamId}]: dedup skip ${dedupKey} (type=${body.event.type})`);
          continue;
        }

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
