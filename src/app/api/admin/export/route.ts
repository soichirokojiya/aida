import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

function toJST(date: Date): string {
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "messages";

  if (type === "messages") {
    const messages = await prisma.message.findMany({
      orderBy: { timestamp: "desc" },
      take: 10000,
      include: { conversation: true },
    });

    const csv = [
      "timestamp,threadId,senderId,senderRole,intent,text",
      ...messages.map((m) =>
        `"${toJST(m.timestamp)}","${m.conversation.externalThreadId}","${m.senderId}","${m.senderRole}","${m.detectedIntent || ""}","${m.text.replace(/"/g, '""')}"`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=umeko-messages-${new Date().toISOString().slice(0, 10)}.csv`,
      },
    });
  }

  if (type === "users") {
    const users = await prisma.lineUser.findMany({
      include: { dmSubscription: true },
    });

    const csv = [
      "lineUserId,trialEndsAt,dmStatus,lastActiveAt,createdAt",
      ...users.map((u) =>
        `"${u.lineUserId}","${toJST(u.trialEndsAt)}","${u.dmSubscription?.status || "none"}","${u.lastActiveAt ? toJST(u.lastActiveAt) : ""}","${toJST(u.createdAt)}"`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=umeko-users-${new Date().toISOString().slice(0, 10)}.csv`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
