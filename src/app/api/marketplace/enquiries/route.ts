import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { createEnquiry } from "@/lib/marketplace/enquiry";

export const dynamic = "force-dynamic";

// Public: a buyer may send an enquiry without an account. Validation, spam checks and rate limits live in createEnquiry.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const user = await getCurrentUser().catch(() => null);
  try {
    const r = await createEnquiry(body, ip, user?.id ?? null);
    if (!r.ok) return NextResponse.json({ error: r.error, field: r.field }, { status: r.status });
    return NextResponse.json({ ok: true, ref: r.ref });
  } catch (e) {
    console.error("[marketplace] enquiry failed:", (e as Error).message);
    return NextResponse.json({ error: "Your enquiry could not be sent right now. Please try again shortly." }, { status: 503 });
  }
}
