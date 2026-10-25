import "server-only";
import { db } from "@/lib/db";
import { STATES } from "@/lib/data";
import { audit } from "./audit";
import { BUSINESS_TYPES, splitList } from "./constants";
import { findDuplicates } from "./dedupe";
import { domainOf, normalizeCin, normalizeEmail, normalizeGstin, normalizeName, normalizePhone, normalizeWebsite, PIN_RE } from "./identity";
import { uniqueLegacySlug } from "./slugs";

export const IMPORT_FIELDS = ["name", "state", "type", "city", "website", "email", "phone", "address", "pinCode", "cin", "gstin", "about", "specializations"] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];
export type ImportRow = Partial<Record<ImportField, string>>;
export const MAX_IMPORT_ROWS = 500;

export interface RowResult {
  row: number; // 1-based position in the file's data rows
  name: string;
  status: "ok" | "duplicate" | "error";
  messages: string[];
}

interface Clean {
  name: string;
  stateName: string;
  type: string;
  city: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  pinCode: string | null;
  cin: string | null;
  gstin: string | null;
  about: string | null;
  specializations: string[];
}

function clean(r: ImportRow): { value?: Clean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const v = (k: ImportField, max = 500) => (r[k] ?? "").toString().trim().slice(0, max);
  const name = v("name", 300);
  if (name.length < 2) errors.push("Company name is missing.");
  const rawState = v("state", 100).toLowerCase();
  const state = STATES.find((s) => s.name.toLowerCase() === rawState || s.slug === rawState);
  if (!state) errors.push(rawState ? `Unknown state “${v("state", 100)}”.` : "State is missing.");

  let type = v("type", 100);
  if (!type) {
    type = "Other";
    warnings.push("No business type — set to Other.");
  } else {
    const match = BUSINESS_TYPES.find((t) => t.toLowerCase() === type.toLowerCase());
    if (match) type = match;
    else {
      warnings.push(`Unrecognised business type “${type}” — set to Other.`);
      type = "Other";
    }
  }

  const website = normalizeWebsite(v("website", 300));
  if (v("website", 300) && !website) warnings.push("Website is not valid — dropped.");
  const email = normalizeEmail(v("email", 200));
  if (v("email", 200) && !email) warnings.push("Email is not valid — dropped.");
  const phoneRaw = v("phone", 60);
  const phone = normalizePhone(phoneRaw);
  if (phoneRaw && !phone) warnings.push("Phone is not valid — dropped.");
  const cin = normalizeCin(v("cin", 30));
  if (v("cin", 30) && !cin) warnings.push("CIN is not in a valid format — dropped.");
  const gstin = normalizeGstin(v("gstin", 30));
  if (v("gstin", 30) && !gstin) warnings.push("GSTIN is not in a valid format — dropped.");
  const pin = v("pinCode", 10);
  const pinCode = PIN_RE.test(pin) ? pin : null;
  if (pin && !pinCode) warnings.push("PIN code is not valid — dropped.");
  if (!website && !email && !phone) errors.push("No usable website, email or phone — a directory record needs at least one way to reach the business.");

  if (errors.length) return { errors, warnings };
  return {
    errors,
    warnings,
    value: { name, stateName: state!.name, type, city: v("city", 120) || null, website, email, phone, address: v("address", 400) || null, pinCode, cin, gstin, about: v("about", 4000) || null, specializations: splitList(v("specializations", 1500), 20, 60) },
  };
}

/** Validate every row and look for duplicates against the database AND earlier rows of the same file. With dryRun=false the valid, non-duplicate rows are created. */
export async function runImport(rows: ImportRow[], opts: { dryRun: boolean; sourceNote: string; filename?: string; actor: { id: string; email: string } }) {
  const results: RowResult[] = [];
  const seen = new Map<string, number>();
  const toCreate: { r: RowResult; c: Clean; stateId: string }[] = [];
  const stateIds = new Map((await db.state.findMany({ select: { id: true, name: true } })).map((s) => [s.name, s.id]));

  for (let i = 0; i < rows.length; i++) {
    const res: RowResult = { row: i + 1, name: (rows[i].name ?? "").toString().slice(0, 120), status: "ok", messages: [] };
    results.push(res);
    const { value, errors, warnings } = clean(rows[i]);
    res.messages.push(...warnings);
    if (!value) {
      res.status = "error";
      res.messages.unshift(...errors);
      continue;
    }
    const stateId = stateIds.get(value.stateName) ?? null;
    if (!stateId) {
      res.status = "error";
      res.messages.unshift(`State “${value.stateName}” is not available in the database yet.`);
      continue;
    }
    // duplicates inside the file
    const keys = [value.cin && `cin:${value.cin}`, value.gstin && `gstin:${value.gstin}`, domainOf(value.website) && `domain:${domainOf(value.website)}`, `name:${stateId}:${normalizeName(value.name)}`].filter(Boolean) as string[];
    const earlier = keys.map((k) => seen.get(k)).find((x) => x !== undefined);
    if (earlier !== undefined) {
      res.status = "duplicate";
      res.messages.unshift(`Same business as row ${earlier} of this file.`);
      continue;
    }
    // duplicates already in the database
    const dups = await findDuplicates({ name: value.name, stateId, website: value.website, cin: value.cin, gstin: value.gstin });
    if (dups.length) {
      res.status = "duplicate";
      res.messages.unshift(`Already in the directory: ${dups[0].company.name} (matched on ${dups[0].reasons.join(", ")}).`);
      continue;
    }
    for (const k of keys) seen.set(k, res.row);
    toCreate.push({ r: res, c: value, stateId });
  }

  let created = 0;
  if (!opts.dryRun && toCreate.length) {
    const batch = await db.importBatch.create({ data: { filename: opts.filename?.slice(0, 200), sourceNote: opts.sourceNote, actorEmail: opts.actor.email, total: rows.length } });
    for (const { r, c, stateId } of toCreate) {
      try {
        await db.company.create({
          data: {
            name: c.name, slug: await uniqueLegacySlug(stateId, c.name), stateId, cityName: c.city, type: c.type,
            website: c.website, email: c.email, phone: c.phone, address: c.address, pinCode: c.pinCode, cin: c.cin, gstin: c.gstin, about: c.about, specializations: c.specializations,
            domain: domainOf(c.website) ?? (c.email ? c.email.split("@")[1] : null), normalizedName: normalizeName(c.name),
            sourceType: "imported", sourceNote: opts.sourceNote, importBatchId: batch.id,
            marketplaceStatus: "unlisted", claimed: false, verificationStatus: "unverified", // imported records are never claimed, verified or public until an admin acts
          },
        });
        created++;
      } catch (e) {
        r.status = "error";
        r.messages.unshift(`Could not be saved: ${(e as Error).message.split("\n").pop()}`);
      }
    }
    const skipped = rows.length - created;
    await db.importBatch.update({ where: { id: batch.id }, data: { created, skipped } });
    await audit("import", batch.id, "import.committed", opts.actor, { created, skipped, sourceNote: opts.sourceNote, filename: opts.filename ?? null });
  }
  const summary = { total: rows.length, ok: results.filter((x) => x.status === "ok").length, duplicate: results.filter((x) => x.status === "duplicate").length, error: results.filter((x) => x.status === "error").length, created };
  return { results, summary };
}
