import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 200) : "") || null;

// Create a saved-search email alert. No account or OTP required — any valid
// email can subscribe, same as a SAM.gov saved-search alert. The unsubscribe
// link in every email is the only way to stop it.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const keywords = text(body.keywords);
  const state = text(body.state);
  const city = text(body.city);
  const category = text(body.category);

  const existing = await db.tenderAlert.findFirst({ where: { email, keywords, state, city, category, active: true } });
  if (existing) return NextResponse.json({ ok: true, alreadySubscribed: true });

  await db.tenderAlert.create({ data: { email, keywords, state, city, category } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });
  await db.tenderAlert.updateMany({ where: { token }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
