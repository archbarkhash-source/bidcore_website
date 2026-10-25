import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OTP_MAX_ATTEMPTS, codesMatch } from "@/lib/otp";
import { payloadFor, pushContractor } from "@/lib/contractor-sync";
import { createEmailProof } from "@/lib/handoff";
import { SESSION_COOKIE, createSessionValue, sessionCookieOptions } from "@/lib/session";

interface Payload {
  name: string;
  email: string;
  phone: string;
  role: string;
  companyName: string;
  city: string | null;
  phoneCodeHash?: string;
  mobile91?: string;
}

// Step 2 of signup: confirm the emailed code, then create the account (or
// sign an existing member back in) and set the session cookie.
export async function POST(req: NextRequest) {
  let body: { email?: unknown; code?: unknown; phoneCode?: unknown; startTenderTrial?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  }

  const otp = await db.signupOtp.findUnique({ where: { email } });
  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "That code has expired. Request a new one." },
      { status: 400 },
    );
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await db.signupOtp.delete({ where: { email } });
    return NextResponse.json(
      { error: "Too many incorrect attempts. Request a new code." },
      { status: 429 },
    );
  }
  const p = otp.payload as unknown as Partial<Payload>;
  // A mobile number was sent its own code at step 1: both codes must be right (a wrong guess of either counts toward the same attempt limit).
  const phoneCode = typeof body.phoneCode === "string" ? body.phoneCode.trim() : "";
  if (p.phoneCodeHash && p.mobile91 && !/^\d{6}$/.test(phoneCode)) {
    return NextResponse.json({ error: "Enter the 6-digit code sent by SMS to your mobile number.", field: "phoneCode" }, { status: 400 });
  }
  const emailOk = codesMatch(otp.codeHash, email, code);
  const phoneOk = !p.phoneCodeHash || !p.mobile91 || codesMatch(p.phoneCodeHash, `phone:${p.mobile91}`, phoneCode);
  if (!emailOk || !phoneOk) {
    await db.signupOtp.update({ where: { email }, data: { attempts: { increment: 1 } } });
    return NextResponse.json(
      { error: !emailOk ? "Incorrect email code. Please try again." : "Incorrect mobile code. Please try again.", field: !emailOk ? "code" : "phoneCode" },
      { status: 400 },
    );
  }

  // An existing member is simply signed back in; stored details aren't overwritten.
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    if (!p.name || !p.phone || !p.role || !p.companyName) {
      return NextResponse.json(
        { error: "No account found for this email. Please sign up first." },
        { status: 404 },
      );
    }
    user = await db.user.create({
      data: {
        name: p.name,
        email,
        phone: p.phone,
        role: p.role,
        companyName: p.companyName,
        city: p.city ?? null,
      },
    });
  }
  await db.signupOtp.delete({ where: { email } });

  // The member is saved here; now copy it to the BidcoreAI India database (and, from there, Contractor_db). A failure is queued for retry, never shown.
  await pushContractor(payloadFor(user));

  if (body.startTenderTrial === true) {
    await db.user.updateMany({
      where: { id: user.id, tenderTrialStartedAt: null },
      data: { tenderTrialStartedAt: new Date() },
    });
  }

  // proof that this address was verified here - the BidcoreAI sign-up from bidcore.in requires it
  const res = NextResponse.json({ ok: true, user: { name: user.name }, handoff: createEmailProof(user.email) });
  res.cookies.set(SESSION_COOKIE, createSessionValue(user.id), sessionCookieOptions);
  return res;
}
