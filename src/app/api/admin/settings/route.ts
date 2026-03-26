import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

async function getConfig(key: string, defaultValue: string): Promise<string> {
  const config = await prisma.systemConfig.findUnique({ where: { key } });
  return config?.value ?? defaultValue;
}

async function setConfig(key: string, value: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function GET() {
  const conflictThreshold = await getConfig("conflict_threshold", "50");
  const systemPrompt = await getConfig("system_prompt", "");

  return NextResponse.json({ conflictThreshold, systemPrompt });
}

export async function PUT(request: Request) {
  const body = await request.json();

  if (body.conflictThreshold !== undefined) {
    await setConfig("conflict_threshold", String(body.conflictThreshold));
  }
  if (body.systemPrompt !== undefined) {
    await setConfig("system_prompt", body.systemPrompt);
  }

  return NextResponse.json({ ok: true });
}
