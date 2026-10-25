// Imports registered construction companies from the Ministry of Corporate
// Affairs "Company Master Data" CSVs published on data.gov.in (one file per
// Registrar of Companies).
//
//   npx tsx prisma/import-mca.ts <file-or-folder> [more...] [--limit 20000] [--all-status] [--dry]
//
// Only General Contractors are kept: the industry code embedded in each CIN
// is NIC 41xxx / 42xxx (2008) or 452xx (2004). Active companies are ranked by
// paid-up capital and the top --limit are loaded.
import "dotenv/config";
import { createReadStream, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { CITIES, STATES } from "../src/lib/data";
import { isBusinessEmail } from "../src/lib/email-domain";

const db = new PrismaClient();

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const LIMIT = parseInt(option("--limit", "20000"), 10);
const ALL_STATUS = flag("--all-status");
const DRY = flag("--dry");
const inputs = args.filter((a, i) => !a.startsWith("--") && !(args[i - 1] ?? "").startsWith("--limit"));

// ---- CSV (streaming, handles quotes and embedded newlines) ----------------
async function* csvRows(path: string): AsyncGenerator<string[]> {
  let field = "";
  let row: string[] = [];
  let quoted = false;
  let pendingQuote = false;

  for await (const chunk of createReadStream(path, { encoding: "utf8" })) {
    for (const ch of chunk as string) {
      if (pendingQuote) {
        pendingQuote = false;
        if (ch === '"') {
          field += '"';
          continue;
        }
        quoted = false;
      }
      if (quoted) {
        if (ch === '"') pendingQuote = true;
        else field += ch;
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field.replace(/\r$/, ""));
        field = "";
        if (row.length > 1 || row[0] !== "") yield row;
        row = [];
      } else {
        field += ch;
      }
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    yield row;
  }
}

const norm = (h: string) => h.replace(/^﻿/, "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");

function pick(rec: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) if (rec[k]) return rec[k].trim();
  return "";
}

// ---- Mapping helpers -------------------------------------------------------
const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const stateBySlug = new Map(STATES.map((s) => [s.slug, s]));
const STATE_ALIASES: Record<string, string> = {
  delhi: "delhi-ncr",
  "nct-of-delhi": "delhi-ncr",
  "national-capital-territory-of-delhi": "delhi-ncr",
  orissa: "odisha",
  pondicherry: "puducherry",
  uttaranchal: "uttarakhand",
  "andaman-and-nicobar-island": "andaman-and-nicobar-islands",
  "andaman-nicobar-islands": "andaman-and-nicobar-islands",
  "dadra-and-nagar-haveli": "dadra-and-nagar-haveli-and-daman-and-diu",
  "daman-and-diu": "dadra-and-nagar-haveli-and-daman-and-diu",
  "jammu-kashmir": "jammu-and-kashmir",
};
function stateSlugFor(name: string): string | null {
  const slug = slugify(name);
  const alias = STATE_ALIASES[slug] ?? slug;
  return stateBySlug.has(alias) ? alias : null;
}

// CIN = L/U + 5-digit industry code + state + year + type + 6-digit number.
function isGeneralContractorCin(cin: string): boolean {
  const nic = cin.slice(1, 6);
  return /^\d{5}$/.test(nic) && (nic.startsWith("41") || nic.startsWith("42") || nic.startsWith("452"));
}

function parseDate(raw: string): Date | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return null;
}

function cityFromAddress(address: string, stateSlug: string): string | null {
  const hay = ` ${address.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
  for (const c of CITIES.filter((c) => c.stateSlug === stateSlug)) {
    if (hay.includes(` ${c.name.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `)) return c.slug;
  }
  return null;
}

interface Candidate {
  cin: string;
  name: string;
  status: string;
  companyClass: string;
  category: string;
  subCategory: string;
  incorporationDate: Date | null;
  stateSlug: string;
  roc: string;
  address: string;
  email: string;
  paidUp: number;
}

function filesIn(path: string): string[] {
  if (statSync(path).isDirectory()) {
    return readdirSync(path)
      .filter((f) => f.toLowerCase().endsWith(".csv"))
      .map((f) => join(path, f));
  }
  return [path];
}

async function main() {
  if (inputs.length === 0) {
    console.error("Usage: npx tsx prisma/import-mca.ts <csv-file-or-folder> [...] [--limit 20000] [--all-status] [--dry]");
    process.exit(1);
  }

  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  let scanned = 0;
  let skippedState = 0;
  let skippedNoDomain = 0;

  for (const file of inputs.flatMap(filesIn)) {
    let header: string[] | null = null;
    for await (const cells of csvRows(file)) {
      if (!header) {
        header = cells.map(norm);
        continue;
      }
      const rec: Record<string, string> = {};
      header.forEach((h, i) => (rec[h] = cells[i] ?? ""));
      scanned++;

      const cin = pick(rec, "CORPORATE_IDENTIFICATION_NUMBER", "CIN").toUpperCase();
      if (!cin || seen.has(cin) || !isGeneralContractorCin(cin)) continue;

      const status = pick(rec, "COMPANY_STATUS", "STATUS");
      if (!ALL_STATUS && status.toLowerCase() !== "active") continue;

      const stateSlug = stateSlugFor(pick(rec, "REGISTERED_STATE", "STATE"));
      if (!stateSlug) {
        skippedState++;
        continue;
      }

      // Companies with no website or company-domain email are not added.
      const email = pick(rec, "EMAIL_ADDR", "EMAIL_ID", "EMAIL").toLowerCase();
      if (!isBusinessEmail(email)) {
        skippedNoDomain++;
        continue;
      }

      seen.add(cin);
      candidates.push({
        cin,
        name: pick(rec, "COMPANY_NAME", "NAME"),
        status,
        companyClass: pick(rec, "COMPANY_CLASS", "CLASS"),
        category: pick(rec, "COMPANY_CATEGORY", "CATEGORY"),
        subCategory: pick(rec, "COMPANY_SUB_CATEGORY", "COMPANY_SUBCATEGORY", "SUB_CATEGORY"),
        incorporationDate: parseDate(pick(rec, "DATE_OF_REGISTRATION", "DATE_OF_INCORPORATION")),
        stateSlug,
        roc: pick(rec, "REGISTRAR_OF_COMPANIES", "ROC_CODE", "ROC").replace(/^roc[-\s]*/i, "ROC "),
        address: pick(rec, "REGISTERED_OFFICE_ADDRESS", "ADDRESS"),
        email,
        paidUp: parseFloat(pick(rec, "PAIDUP_CAPITAL", "PAID_UP_CAPITAL")) || 0,
      });
    }
    console.log(`${file}: ${candidates.length} general contractors so far`);
  }

  candidates.sort((a, b) => b.paidUp - a.paidUp);
  const chosen = candidates.slice(0, LIMIT);
  console.log(
    `Scanned ${scanned.toLocaleString()} rows; ${candidates.length.toLocaleString()} general contractors ` +
      `(${skippedState} skipped for unknown state, ${skippedNoDomain} for no company domain); importing ${chosen.length.toLocaleString()}.`,
  );
  if (DRY) {
    console.log("Dry run — nothing written. Sample:", chosen.slice(0, 3));
    return;
  }

  const stateIds = new Map((await db.state.findMany()).map((s) => [s.slug, s.id]));
  const cityIds = new Map((await db.city.findMany()).map((c) => [`${c.stateId}:${c.slug}`, c.id]));

  const rows = chosen.flatMap((c) => {
    const stateId = stateIds.get(c.stateSlug);
    if (!stateId) return [];
    const regNumber = c.cin.slice(-6).replace(/^0+/, "") || "0";
    const citySlug = cityFromAddress(c.address, c.stateSlug);
    return [
      {
        slug: `${slugify(c.name).slice(0, 70)}-${regNumber}`,
        name: c.name,
        stateId,
        cityId: citySlug ? (cityIds.get(`${stateId}:${citySlug}`) ?? null) : null,
        cityName: citySlug ? (CITIES.find((x) => x.slug === citySlug)?.name ?? null) : null,
        type: "General Contractor",
        cin: c.cin,
        companyStatus: c.status || null,
        listedStatus: c.cin.startsWith("L") ? "Listed" : "Unlisted",
        roc: c.roc || null,
        registrationNumber: regNumber,
        companyCategory: c.category || null,
        companySubCategory: c.subCategory || null,
        companyClass: c.companyClass || null,
        incorporationDate: c.incorporationDate,
        address: c.address || null,
        email: c.email || null,
      },
    ];
  });

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 1000) {
    const res = await db.company.createMany({ data: rows.slice(i, i + 1000), skipDuplicates: true });
    inserted += res.count;
    console.log(`  inserted ${inserted.toLocaleString()} / ${rows.length.toLocaleString()}`);
  }
  console.log(`Done. ${inserted.toLocaleString()} new companies added (${rows.length - inserted} already existed).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
