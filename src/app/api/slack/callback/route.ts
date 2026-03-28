import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://umeko.life";

  if (error || !code) {
    console.error("Slack OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}?slack=error`);
  }

  try {
    const res = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: `${baseUrl}/api/slack/callback`,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error("Slack OAuth exchange failed:", data.error, data);
      return NextResponse.redirect(`${baseUrl}?slack=error&reason=${encodeURIComponent(data.error || "unknown")}`);
    }

    // Save workspace to DB
    await prisma.slackWorkspace.upsert({
      where: { teamId: data.team.id },
      update: {
        teamName: data.team.name,
        botToken: data.access_token,
        botUserId: data.bot_user_id,
        installedByUserId: data.authed_user?.id,
      },
      create: {
        teamId: data.team.id,
        teamName: data.team.name,
        botToken: data.access_token,
        botUserId: data.bot_user_id,
        installedByUserId: data.authed_user?.id,
      },
    });

    console.log(`Slack workspace installed: ${data.team.name} (${data.team.id})`);
    return NextResponse.redirect(`${baseUrl}?slack=success`);
  } catch (err) {
    console.error("Slack OAuth callback error:", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.redirect(`${baseUrl}?slack=error&reason=${encodeURIComponent(msg)}`);
  }
}
