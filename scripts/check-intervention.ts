import { prisma } from "../src/lib/db/prisma";
async function main() {
  // Recent group messages
  const msgs = await prisma.message.findMany({
    where: { conversation: { channelType: "line", externalThreadId: { not: { startsWith: "U" } } } },
    orderBy: { timestamp: "desc" },
    take: 10,
    select: { text: true, conflictScore: true, detectedIntent: true, senderRole: true, timestamp: true, conversationId: true },
  });
  console.log("=== Recent group messages ===");
  for (const m of msgs) {
    console.log(`[${m.senderRole}] score=${m.conflictScore} intent=${m.detectedIntent} text=${m.text.slice(0, 80)} time=${m.timestamp.toISOString()}`);
  }

  // Recent interventions
  const interventions = await prisma.intervention.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { triggerType: true, createdAt: true, conversationId: true, responseText: true },
  });
  console.log("\n=== Recent interventions ===", interventions.length);
  for (const i of interventions) {
    console.log(`  ${i.triggerType} ${i.createdAt.toISOString()} conv=${i.conversationId} text=${i.responseText.slice(0, 60)}`);
  }

  await prisma.$disconnect();
}
main();
