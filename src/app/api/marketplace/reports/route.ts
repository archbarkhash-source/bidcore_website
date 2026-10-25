import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { REPORT_REASONS } from "@/lib/marketplace/constants";
import { normalizeEmail } from "@/lib/marketplace/identity";

export const dynamic = "force-dynamic";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (clean(b.trap, 20)) return NextResponse.json({ ok: true });
  const targetType = b.targetType === "listing" ? "listing" : b.targetType === "company" ? "company" : null;
  const targetId = clean(b.targetId, 40);
  const reason = clean(b.reason, 40);
  const detail = clean(b.detail, 2000);
  if (!targetType || !targetId) return NextResponse.json({ error: "Unknown item." }, { status: 400 });
  if (!REPORT_REASONS.some((r) => r.value === reason)) return NextResponse.json({ error: "Choose a reason." }, { status: 400 });
  if (detail.length < 10) return NextResponse.json({ error: "Please add a few details." }, { status: 400 });

  try {
    const exists = targetType === "company" ? await db.company.findUnique({ where: { id: targetId }, select: { id: true } }) : await db.marketplaceListing.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Unknown item." }, { status: 404 });
    // Cheap flood guard: at most 20 open reports per target.
    const open = await db.marketplaceReport.count({ where: { targetType, targetId, status: "open" } });
    if (open >= 20) return NextResponse.json({ ok: true });
    await db.marketplaceReport.create({ data: { targetType, targetId, reason, detail, reporterEmail: normalizeEmail(clean(b.email, 200)) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[marketplace] report failed:", (e as Error).message);
    return NextResponse.json({ error: "Could not send the report right now." }, { status: 503 });
  }
}
