import "server-only";
import { createHmac } from "node:crypto";

const API = (process.env.BIDCORE_API_URL ?? process.env.NEXT_PUBLIC_BIDCORE_API_URL ?? "").replace(/\/$/, "");

export interface DirectoryContact {
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
}

export type ContactResult = { ok: true; contact: DirectoryContact } | { ok: false; status: number; message?: string };

// The real phone / e-mail / address of a Bidcore directory company. Only ever called from our own route for a signed-in member: the request is signed for
// this company AND this member (the secret never leaves the server), and the backend audits it and caps how many companies one member can open a day.
export async function fetchDirectoryContact(slug: string, memberId: string): Promise<ContactResult> {
  const secret = process.env.WEBSITE_SYNC_SECRET;
  if (!API || !secret) return { ok: false, status: 503 };
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac("sha256", secret).update(`${ts}.${slug}:${memberId}`).digest("hex");
  try {
    const res = await fetch(`${API}/api/public/contractors/${encodeURIComponent(slug)}/contact`, {
      method: "POST",
      headers: { "X-Sync-Timestamp": ts, "X-Sync-Signature": sig, "X-Member-Id": memberId, "X-Bidcore-Site-Key": process.env.PUBLIC_SITE_KEY ?? "" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, status: res.status, message: typeof body?.detail === "string" ? body.detail : undefined };
    }
    return { ok: true, contact: (await res.json()).contact as DirectoryContact };
  } catch {
    return { ok: false, status: 0 };
  }
}
