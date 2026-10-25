import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { retryPending } from "@/lib/contractor-sync";

// Called by a scheduler (cron / Azure / Vercel cron) every few minutes: copies members that could not be pushed to BidcoreAI the first time.
export async function POST(req: NextRequest) {
  const key = process.env.SYNC_RETRY_KEY ?? "";
  const given = req.headers.get("x-retry-key") ?? "";
  const a = Buffer.from(key);
  const b = Buffer.from(given);
  if (!key || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await retryPending());
}
