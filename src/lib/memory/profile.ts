import { prisma } from "../db/prisma";
import { chatCompletionJson } from "../llm/client";

// Extract and update user profile from conversation
export async function updateUserProfile(
  userId: string,
  channelType: string,
  recentMessages: string[]
): Promise<void> {
  if (recentMessages.length < 3) return;

  try {
    const existing = await prisma.userProfile.findUnique({ where: { userId } });

    const result = await chatCompletionJson<{
      personality?: string;
      topics?: string;
      preferences?: string;
    }>(
      `ユーザーの会話から、以下の情報を抽出してJSON形式で返してください。
既存の情報がある場合は、新しい情報で更新・補完してください。
情報がなければnullを返してください。

personality: 性格傾向（穏やか、せっかち、心配性、等の一言メモ）
topics: よく相談するテーマ（仕事、家族、人間関係、等をカンマ区切り）
preferences: 対応上の注意点（論理的な説明を好む、共感を重視、等）

${existing ? `現在の情報: personality=${existing.personality || "なし"}, topics=${existing.topics || "なし"}, preferences=${existing.preferences || "なし"}` : "新規ユーザー"}`,
      recentMessages.slice(-10).join("\n"),
      { purpose: "intent" }
    );

    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(result.personality ? { personality: result.personality } : {}),
        ...(result.topics ? { topics: result.topics } : {}),
        ...(result.preferences ? { preferences: result.preferences } : {}),
      },
      create: {
        userId,
        channelType,
        personality: result.personality || null,
        topics: result.topics || null,
        preferences: result.preferences || null,
      },
    });
  } catch (err) {
    console.warn("updateUserProfile failed:", err instanceof Error ? err.message : err);
  }
}

// Get user profile context string for LLM
export async function getUserProfileContext(userId: string): Promise<string> {
  try {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) return "";

    const parts: string[] = [];
    if (profile.personality) parts.push(`性格: ${profile.personality}`);
    if (profile.topics) parts.push(`よく話すテーマ: ${profile.topics}`);
    if (profile.preferences) parts.push(`対応のコツ: ${profile.preferences}`);

    return parts.length > 0 ? `\n\nこのユーザーについて:\n${parts.join("\n")}` : "";
  } catch {
    return "";
  }
}

// Update group relationship memory after an intervention
export async function updateGroupRelationship(
  conversationId: string,
  recentMessages: string[],
  interventionText: string
): Promise<void> {
  try {
    const existing = await prisma.groupRelationship.findUnique({ where: { conversationId } });

    const result = await chatCompletionJson<{
      members?: Record<string, { role?: string; sensitivity?: string[] }>;
      groupNorms?: string;
      conflictNote?: string;
    }>(
      `グループの会話と介入内容から、グループの関係性情報を更新してください。

${existing ? `現在の情報: ${JSON.stringify({ members: existing.members, groupNorms: existing.groupNorms })}` : "新規グループ"}

members: 各メンバーの役割と敏感なトピック
groupNorms: グループの雰囲気メモ（一言）
conflictNote: 今回の対立のメモ（何がすれ違っていたか一言）`,
      `会話:\n${recentMessages.slice(-10).join("\n")}\n\nうめこの介入: ${interventionText}`,
      { purpose: "intent" }
    );

    const existingRels = (existing?.relationships as Array<{ date: string; note: string }>) || [];
    const newRels = [...existingRels];
    if (result.conflictNote) {
      newRels.push({
        date: new Date().toISOString().split("T")[0],
        note: result.conflictNote,
      });
    }

    await prisma.groupRelationship.upsert({
      where: { conversationId },
      update: {
        ...(result.members ? { members: JSON.parse(JSON.stringify(result.members)) } : {}),
        ...(result.groupNorms ? { groupNorms: result.groupNorms } : {}),
        relationships: JSON.parse(JSON.stringify(newRels)),
      },
      create: {
        conversationId,
        members: result.members ? JSON.parse(JSON.stringify(result.members)) : undefined,
        groupNorms: result.groupNorms || null,
        relationships: JSON.parse(JSON.stringify(newRels)),
      },
    });
  } catch (err) {
    console.warn("updateGroupRelationship failed:", err instanceof Error ? err.message : err);
  }
}

// Get group relationship context for LLM
export async function getGroupRelationshipContext(conversationId: string): Promise<string> {
  try {
    const rel = await prisma.groupRelationship.findUnique({ where: { conversationId } });
    if (!rel) return "";

    const parts: string[] = [];
    if (rel.groupNorms) parts.push(`グループの空気: ${rel.groupNorms}`);
    if (rel.members) parts.push(`メンバー情報: ${JSON.stringify(rel.members)}`);
    const rels = rel.relationships as Array<{ date?: string; note?: string }> | null;
    if (rels?.length) {
      const recent = rels.slice(-3).map(r => `${r.date}: ${r.note}`).join(", ");
      parts.push(`最近の対立: ${recent}`);
    }

    return parts.length > 0 ? parts.join("\n") : "";
  } catch {
    return "";
  }
}
