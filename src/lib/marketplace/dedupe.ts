import "server-only";
import { db } from "@/lib/db";
import { domainOf, normalizeCin, normalizeGstin, normalizeName } from "./identity";

export interface Candidate {
  name: string;
  stateId?: string | null;
  website?: string | null;
  cin?: string | null;
  gstin?: string | null;
  excludeId?: string;
}

export type MatchReason = "CIN" | "GSTIN" | "Website domain" | "Name and state";

export interface DuplicateMatch {
  company: { id: string; name: string; cityName: string | null; claimed: boolean; marketplaceStatus: string; state: { name: string } };
  reasons: MatchReason[];
}

const select = { id: true, name: true, cityName: true, claimed: true, marketplaceStatus: true, state: { select: { name: true } } } as const;

/** Existing active companies that are probably the same business, with the identifier that matched. CIN / GSTIN / website domain are strong; normalized name within a state is weaker. */
export async function findDuplicates(c: Candidate): Promise<DuplicateMatch[]> {
  const cin = normalizeCin(c.cin);
  const gstin = normalizeGstin(c.gstin);
  const domain = domainOf(c.website);
  const nname = normalizeName(c.name);
  const or: Record<string, unknown>[] = [];
  if (cin) or.push({ cin });
  if (gstin) or.push({ gstin });
  if (domain) or.push({ domain });
  if (nname.length >= 4 && c.stateId) or.push({ normalizedName: nname, stateId: c.stateId });
  if (or.length === 0) return [];
  const rows = await db.company.findMany({ where: { active: true, ...(c.excludeId ? { id: { not: c.excludeId } } : {}), OR: or }, select: { ...select, cin: true, gstin: true, domain: true, normalizedName: true, stateId: true }, take: 10 });
  return rows.map((r) => {
    const reasons: MatchReason[] = [];
    if (cin && r.cin === cin) reasons.push("CIN");
    if (gstin && r.gstin === gstin) reasons.push("GSTIN");
    if (domain && r.domain === domain) reasons.push("Website domain");
    if (nname && r.normalizedName === nname && r.stateId === c.stateId) reasons.push("Name and state");
    return { company: { id: r.id, name: r.name, cityName: r.cityName, claimed: r.claimed, marketplaceStatus: r.marketplaceStatus, state: r.state }, reasons };
  });
}

export interface DuplicateGroup {
  key: string;
  reason: MatchReason;
  companies: { id: string; name: string; cityName: string | null; state: string; claimed: boolean; marketplaceStatus: string; sourceType: string; listings: number }[];
}

/** Groups of active companies sharing a CIN, GSTIN, website domain or normalized name + state. Used by the admin duplicates page. */
export async function duplicateGroups(): Promise<DuplicateGroup[]> {
  const rows = await db.company.findMany({
    where: { active: true },
    select: { id: true, name: true, cityName: true, claimed: true, marketplaceStatus: true, sourceType: true, cin: true, gstin: true, domain: true, normalizedName: true, stateId: true, state: { select: { name: true } }, _count: { select: { listings: true } } },
  });
  const buckets = new Map<string, { reason: MatchReason; ids: Set<string> }>();
  const add = (key: string, reason: MatchReason, id: string) => {
    const b = buckets.get(key) ?? { reason, ids: new Set<string>() };
    b.ids.add(id);
    buckets.set(key, b);
  };
  for (const r of rows) {
    if (r.cin) add(`cin:${r.cin}`, "CIN", r.id);
    if (r.gstin) add(`gstin:${r.gstin}`, "GSTIN", r.id);
    if (r.domain) add(`domain:${r.domain}`, "Website domain", r.id);
    const n = r.normalizedName || normalizeName(r.name);
    if (n.length >= 4) add(`name:${r.stateId}:${n}`, "Name and state", r.id);
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  const seen = new Set<string>();
  const out: DuplicateGroup[] = [];
  for (const [key, b] of buckets) {
    if (b.ids.size < 2) continue;
    const sig = [...b.ids].sort().join("|");
    if (seen.has(sig)) continue; // the same set of companies matched on several identifiers - show once
    seen.add(sig);
    out.push({
      key,
      reason: b.reason,
      companies: [...b.ids].map((id) => {
        const r = byId.get(id)!;
        return { id, name: r.name, cityName: r.cityName, state: r.state.name, claimed: r.claimed, marketplaceStatus: r.marketplaceStatus, sourceType: r.sourceType, listings: r._count.listings };
      }),
    });
  }
  return out;
}
