import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { slugifyText } from "./constants";

/** Globally unique /marketplace/companies/{slug}. */
export async function uniqueMarketplaceSlug(name: string, city?: string | null, state?: string | null): Promise<string> {
  const base = slugifyText([name, city ?? state ?? ""].filter(Boolean).join(" ")) || "company";
  for (let i = 0; i < 8; i++) {
    const candidate = i === 0 ? base : `${base}-${i === 1 ? slugifyText(state ?? "") || randomBytes(2).toString("hex") : randomBytes(2).toString("hex")}`;
    if (!(await db.company.findUnique({ where: { marketplaceSlug: candidate }, select: { id: true } }))) return candidate;
  }
  return `${base}-${randomBytes(4).toString("hex")}`;
}

/** The legacy per-state Company.slug (unique together with stateId). */
export async function uniqueLegacySlug(stateId: string, name: string): Promise<string> {
  const base = slugifyText(name) || "company";
  for (let i = 0; i < 8; i++) {
    const candidate = i === 0 ? base : `${base}-${randomBytes(2).toString("hex")}`;
    if (!(await db.company.findUnique({ where: { stateId_slug: { stateId, slug: candidate } }, select: { id: true } }))) return candidate;
  }
  return `${base}-${randomBytes(4).toString("hex")}`;
}

export async function uniqueListingSlug(title: string): Promise<string> {
  const base = slugifyText(title, 70) || "listing";
  for (let i = 0; i < 6; i++) {
    const candidate = `${base}-${randomBytes(2).toString("hex")}`;
    if (!(await db.marketplaceListing.findUnique({ where: { slug: candidate }, select: { id: true } }))) return candidate;
  }
  return `${base}-${randomBytes(5).toString("hex")}`;
}

export async function stateIdByName(name: string): Promise<string | null> {
  const st = await db.state.findFirst({ where: { name }, select: { id: true } });
  return st?.id ?? null;
}
