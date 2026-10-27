import { createHmac } from "node:crypto";
import { db } from "@/lib/db";

// A contractor / member / listing is saved in THIS website's database first, then copied - signed, idempotent - into the BidcoreAI India database
// (contractor_db schema), which keeps a second copy in the separate Contractor_db database. The three stores never share a transaction, so:
//   * the push is retried from a queue (contractor_sync_outbox) when the backend is unreachable - a sign-up is never lost and never blocked;
//   * the backend upserts on the website id, so a retry or a duplicate is harmless.

const API = (process.env.BIDCORE_API_URL ?? process.env.NEXT_PUBLIC_BIDCORE_API_URL ?? "").replace(/\/$/, "");

export interface SyncPayload {
  website_user_id: string;
  email: string;
  company_name: string;
  company_type?: string | null;
  city?: string | null;
  state?: string | null;
  trades?: string[];
  website?: string | null;
  about?: string | null;
  contact_name?: string | null; // who to contact at the company: shown to signed-in BidcoreAI users inviting tenderers, never on the public site
  contact_designation?: string | null; // that person's designation (Managing Partner, Estimator ...); sent with the contact
  phone?: string | null;
  listed?: boolean;
}

export interface ListingSyncPayload {
  website_listing_id: string;
  website_user_id: string;
  email_account: string; // the member's verified sign-up e-mail (links to a BidcoreAI account; never shown)
  kind: "professional" | "equipment";
  role?: string | null;
  name: string;
  headline?: string | null;
  about?: string | null;
  state?: string | null;
  city?: string | null;
  skills?: string[];
  experience_years?: number | null;
  availability?: string | null;
  equipment_details?: string | null;
  phone?: string | null;
  email?: string | null;
  listed: boolean;
  removed?: boolean;
}

interface MemberLike {
  id: string;
  email: string;
  companyName: string;
  role: string;
  city: string | null;
  name?: string | null;
  phone?: string | null;
}

export const payloadFor = (u: MemberLike): SyncPayload => ({
  website_user_id: u.id,
  email: u.email,
  company_name: u.companyName,
  company_type: u.role,
  city: u.city,
  contact_name: u.name ?? null,
  phone: u.phone ?? null,
});

async function post(path: string, payload: object): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.WEBSITE_SYNC_SECRET;
  if (!API || !secret) return { ok: false, error: "sync not configured" };
  const body = JSON.stringify(payload);
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sync-Timestamp": ts, "X-Sync-Signature": sig },
      body,
      signal: AbortSignal.timeout(6000),
    });
    return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

/** Copy one item to the BidcoreAI India database. Never throws; on failure the newest state of that item is queued for a retry. */
async function pushToBackend(path: string, key: string, payload: object): Promise<boolean> {
  const r = await post(path, payload);
  if (r.ok) {
    await db.contractorSyncOutbox.deleteMany({ where: { key } }).catch(() => {});
    return true;
  }
  try {
    await db.contractorSyncOutbox.upsert({
      where: { key },
      create: { key, path, payload: payload as object, lastError: r.error ?? null },
      update: { path, payload: payload as object, lastError: r.error ?? null, attempts: { increment: 1 } },
    });
  } catch {
    // the outbox table is not there yet (schema not pushed) - nothing more can be done here
  }
  return false;
}

export const pushContractor = (payload: SyncPayload) => pushToBackend("/api/public/contractor-sync", `member:${payload.website_user_id}`, payload);
export const pushListing = (payload: ListingSyncPayload) => pushToBackend("/api/public/listing-sync", `listing:${payload.website_listing_id}`, payload);

/** Retry whatever is queued. Called by the protected /api/contractor-sync/retry route (a scheduler hits it every few minutes). */
export async function retryPending(limit = 50): Promise<{ tried: number; copied: number }> {
  let rows: { id: string; path: string; payload: unknown }[] = [];
  try {
    rows = await db.contractorSyncOutbox.findMany({ orderBy: { updatedAt: "asc" }, take: limit });
  } catch {
    return { tried: 0, copied: 0 };
  }
  let copied = 0;
  for (const row of rows) {
    const r = await post(row.path, row.payload as object);
    if (r.ok) {
      await db.contractorSyncOutbox.deleteMany({ where: { id: row.id } });
      copied++;
    } else {
      await db.contractorSyncOutbox.updateMany({ where: { id: row.id }, data: { attempts: { increment: 1 }, lastError: r.error ?? null } });
    }
  }
  return { tried: rows.length, copied };
}
