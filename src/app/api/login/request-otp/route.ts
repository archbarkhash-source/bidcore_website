import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendVerificationCode } from "@/lib/mail";
import { OTP_RESEND_MS, OTP_TTL_MS, generateCode, hashCode } from "@/lib/otp";

// Sign-in for an existing member: just an email, then a one-time code.
export async function POST(req: NextRequest) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address.", field: "email" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return NextResponse.json(
      { error: "No account found for this email. Please sign up first.", field: "email", noAccount: true },
      { status: 404 },
    );
  }

  const existing = await db.signupOtp.findUnique({ where: { email } });
  if (existing && Date.now() - existing.lastSentAt.getTime() < OTP_RESEND_MS) {
    return NextResponse.json(
      { error: "A code was just sent. Please wait a few seconds before requesting another." },
      { status: 429 },
    );
  }

  const code = generateCode();
  const data = {
    codeHash: hashCode(email, code),
    payload: { signIn: true },
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
    lastSentAt: new Date(),
  };
  await db.signupOtp.upsert({ where: { email }, update: data, create: { email, ...data } });

  try {
    await sendVerificationCode(email, code);
  } catch (err) {
    const e = err as { code?: string; responseCode?: number; message?: string };
    console.error("[login] verification email failed:", e.code, e.responseCode, e.message);
    await db.signupOtp.delete({ where: { email } }).catch(() => {});
    return NextResponse.json(
      { error: "We couldn't send the verification email. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
