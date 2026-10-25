import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidEmail } from "@/lib/email-domain";
import { sendVerificationCode } from "@/lib/mail";
import { OTP_RESEND_MS, OTP_TTL_MS, generateCode, hashCode } from "@/lib/otp";
import { ROLE_LABELS, isMarket } from "@/lib/roles";
import { allowSms, indianMobile, isValidIndianMobile, sendPhoneCode } from "@/lib/sms";

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// Step 1 of signup: validate the details, then email a one-time code - and, for an Indian (+91) mobile number on the add-your-details / view-contacts
// sign-ups, SMS a second code to the phone. No account or session exists until every code is confirmed.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const phone = clean(body.phone);
  const role = clean(body.role);
  const companyName = clean(body.companyName);
  const city = clean(body.city) || null;
  const country = clean(body.country) || "IN";
  // Product sign-ups (intent "tender") hand over to the BidcoreAI app, which has its own flow; everything else also verifies an Indian mobile number.
  const intent = clean(body.intent);
  const mobile91 = intent === "tender" ? null : indianMobile(phone);

  if (!name || !email || !phone || !role || !companyName) {
    return NextResponse.json(
      { error: "Name, email, phone, role and company name are all required." },
      { status: 400 },
    );
  }
  if (!ROLE_LABELS.includes(role)) {
    return NextResponse.json({ error: "Choose who you are from the list.", field: "role" }, { status: 400 });
  }
  if (!isMarket(country)) {
    return NextResponse.json({ error: "Choose your country.", field: "country" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address.", field: "email" }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "Enter a valid phone number.", field: "phone" }, { status: 400 });
  }
  if (mobile91 && !isValidIndianMobile(mobile91)) {
    return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number.", field: "phone" }, { status: 400 });
  }

  const existing = await db.signupOtp.findUnique({ where: { email } });
  if (existing && Date.now() - existing.lastSentAt.getTime() < OTP_RESEND_MS) {
    return NextResponse.json(
      { error: "A code was just sent. Please wait a few seconds before requesting another." },
      { status: 429 },
    );
  }

  if (mobile91) {
    const caller = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!allowSms(`mobile:${mobile91}`, 5) || !allowSms(`ip:${caller}`, 20)) {
      return NextResponse.json({ error: "Too many codes requested. Please try again later." }, { status: 429 });
    }
  }

  const code = generateCode();
  const phoneCode = mobile91 ? generateCode() : null;
  const data = {
    codeHash: hashCode(email, code),
    payload: {
      name,
      email,
      phone,
      role,
      companyName,
      city,
      country,
      ...(mobile91 && phoneCode ? { phoneCodeHash: hashCode(`phone:${mobile91}`, phoneCode), mobile91 } : {}),
    },
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
    lastSentAt: new Date(),
  };
  await db.signupOtp.upsert({ where: { email }, update: data, create: { email, ...data } });

  try {
    await sendVerificationCode(email, code);
  } catch (err) {
    const e = err as { code?: string; responseCode?: number; message?: string };
    console.error("[signup] verification email failed:", e.code, e.responseCode, e.message);
    await db.signupOtp.delete({ where: { email } }).catch(() => {});
    return NextResponse.json(
      { error: "We couldn't send the verification email. Check the address and try again." },
      { status: 502 },
    );
  }

  if (mobile91 && phoneCode) {
    try {
      await sendPhoneCode(mobile91, phoneCode);
    } catch (err) {
      console.error("[signup] verification SMS failed:", (err as Error).message);
      await db.signupOtp.delete({ where: { email } }).catch(() => {});
      return NextResponse.json(
        { error: "We couldn't send the SMS code to that mobile number. Check the number and try again.", field: "phone" },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ ok: true, phoneRequired: Boolean(mobile91) });
}
