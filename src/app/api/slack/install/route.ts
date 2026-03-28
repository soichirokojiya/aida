import { NextResponse } from "next/server";

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID!;
const SCOPES = [
  "chat:write",
  "channels:history",
  "groups:history",
  "im:history",
  "mpim:history",
  "app_mentions:read",
  "users:read",
  "channels:read",
  "groups:read",
  "im:read",
].join(",");

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://umeko.life";
  const redirectUri = `${baseUrl}/api/slack/callback`;

  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", SLACK_CLIENT_ID);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("redirect_uri", redirectUri);

  return NextResponse.redirect(url.toString());
}
