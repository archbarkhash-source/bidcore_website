import "server-only";
import { createHmac } from "node:crypto";

// Proof, signed with the secret shared with the BidcoreAI server (WEBSITE_SYNC_SECRET), that this e-mail address was verified here with the e-mail code. The BidcoreAI
// sign-up from bidcore.in requires it: only the verified address can be registered, and only for an hour. Same format as backend/website_handoff.py.
export function createEmailProof(email: string, ttlSeconds = 30 * 60): string | null {
  const secret = process.env.WEBSITE_SYNC_SECRET;
  if (!secret) return null;
  const body = Buffer.from(JSON.stringify({ email: email.trim().toLowerCase(), exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString("base64url");
  return `${body}.${createHmac("sha256", secret).update(body).digest("hex")}`;
}
