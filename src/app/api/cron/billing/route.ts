import { NextRequest, NextResponse } from "next/server";
import { runBillingCheck } from "@/lib/billing/check";

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await runBillingCheck();
    console.log("Billing check results:", results);
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("Billing check error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
