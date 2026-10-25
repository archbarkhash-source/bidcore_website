// Phone-number OTP by SMS (MSG91). Used only for Indian (+91) numbers on the "add your details" / "view contacts" sign-ups.
//
// MSG91 needs a DLT-approved OTP template that contains ##OTP##. Set in the host's environment (never committed):
//   MSG91_AUTH_KEY     your MSG91 auth key
//   MSG91_TEMPLATE_ID  the approved OTP template's id (the sender id is part of that template)
// Without them, production refuses to send (the form shows an error); in development the code is printed in the server console instead.

const MSG91_OTP_URL = "https://control.msg91.com/api/v5/otp";

/** "+91 98765 43210" -> "919876543210". Null when the number is not a +91 number. */
export function indianMobile(phone: string): string | null {
  const t = phone.trim();
  if (!t.startsWith("+91")) return null;
  const national = t.replace(/\D/g, "").slice(2).replace(/^0+/, "");
  return `91${national}`;
}

export const isValidIndianMobile = (mobile91: string) => /^91[6-9]\d{9}$/.test(mobile91);

export function smsConfigured(): boolean {
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
}

export async function sendPhoneCode(mobile91: string, code: string): Promise<void> {
  if (!smsConfigured()) {
    if (process.env.NODE_ENV === "production") throw new Error("SMS is not configured (MSG91_AUTH_KEY / MSG91_TEMPLATE_ID)");
    console.warn(`[sms] MSG91 not configured - development only: OTP for +${mobile91} is ${code}`);
    return;
  }
  const qs = new URLSearchParams({
    template_id: process.env.MSG91_TEMPLATE_ID!,
    mobile: mobile91,
    authkey: process.env.MSG91_AUTH_KEY!,
    otp: code,
    otp_expiry: "10",
  });
  const res = await fetch(`${MSG91_OTP_URL}?${qs}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const json = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
  if (!res.ok || json.type !== "success") throw new Error(`MSG91 rejected the OTP request (${res.status}): ${json.message ?? "no message"}`);
}

// SMS costs money, so cap it: per mobile number and per caller. In-memory, so it is per server instance - a safety net, not a substitute for MSG91's own limits.
const sent = new Map<string, number[]>();
export function allowSms(key: string, max: number, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (sent.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    sent.set(key, recent);
    return false;
  }
  recent.push(now);
  sent.set(key, recent);
  return true;
}
