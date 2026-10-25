import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_MS = 30 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

// Only this HMAC is stored, never the code. Bound to the email so a hash
// can't be replayed against another address.
export function hashCode(email: string, code: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "")
    .update(`${email.toLowerCase()}:${code}`)
    .digest("hex");
}

export function codesMatch(expectedHash: string, email: string, code: string): boolean {
  const a = Buffer.from(expectedHash);
  const b = Buffer.from(hashCode(email, code));
  return a.length === b.length && timingSafeEqual(a, b);
}
