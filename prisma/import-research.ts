// Loads researched companies from JSON files into the database.
//
//   npx tsx prisma/import-research.ts <file-or-folder> [more...] [--dry]
//
// Each file is an array of:
//   { name, type, state, city?, website?, email?, phone?, address? }
//
// A company is added only if it has its own website or a company-domain email.
// Directory / social pages (Justdial, IndiaMART, Facebook, ...) don't count.
import "dotenv/config";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { CITIES, COMPANY_TYPES, STATES } from "../src/lib/data";
import { isBusinessEmail } from "../src/lib/email-domain";

const db = new PrismaClient();
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const inputs = args.filter((a) => !a.startsWith("--"));

const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const NOT_A_COMPANY_SITE = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "justdial.com",
  "indiamart.com",
  "tradeindia.com",
  "sulekha.com",
  "99acres.com",
  "magicbricks.com",
  "housing.com",
  "wikipedia.org",
  "zaubacorp.com",
  "tofler.in",
  "google.com",
  "blogspot.com",
  "wixsite.com",
];

// Returns a clean https URL, or null if it isn't the company's own site.
function cleanWebsite(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!host.includes(".")) return null;
    if (NOT_A_COMPANY_SITE.some((d) => host === d || host.endsWith(`.${d}`))) return null;
    return `${u.protocol}//${u.hostname}${u.pathname === "/" ? "" : u.pathname}`.replace(/\/$/, "");
  } catch {
    return null;
  }
}

const STATE_ALIASES: Record<string, string> = {
  delhi: "delhi-ncr",
  "new-delhi": "delhi-ncr",
  "nct-of-delhi": "delhi-ncr",
  orissa: "odisha",
  pondicherry: "puducherry",
  uttaranchal: "uttarakhand",
};
const stateSlugs = new Set(STATES.map((s) => s.slug));
function stateSlugFor(name: string): string | null {
  const s = slugify(name);
  const slug = STATE_ALIASES[s] ?? s;
  return stateSlugs.has(slug) ? slug : null;
}

interface Item {
  name?: string;
  type?: string;
  state?: string;
  city?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
}

function filesIn(path: string): string[] {
  return statSync(path).isDirectory()
    ? readdirSync(path)
        .filter((f) => f.toLowerCase().endsWith(".json"))
        .map((f) => join(path, f))
    : [path];
}

async function main() {
  if (inputs.length === 0) {
    console.error("Usage: npx tsx prisma/import-research.ts <json-file-or-folder> [...] [--dry]");
    process.exit(1);
  }

  const stateIds = new Map((await db.state.findMany()).map((s) => [s.slug, s.id]));
  const cityIds = new Map((await db.city.findMany()).map((c) => [`${c.stateId}:${c.slug}`, c.id]));
  const validTypes = new Set<string>(COMPANY_TYPES);

  const existing = await db.company.findMany({ select: { stateId: true, slug: true, website: true } });
  const takenSlug = new Set(existing.map((e) => `${e.stateId}:${e.slug}`));
  const takenHost = new Set(
    existing.flatMap((e) => (e.website ? [new URL(e.website).hostname.replace(/^www\./, "")] : [])),
  );

  const stats = { read: 0, noDomain: 0, badType: 0, badState: 0, duplicate: 0 };
  const rows: Parameters<typeof db.company.createMany>[0] extends infer A
    ? A extends { data: infer D }
      ? D extends unknown[]
        ? D
        : never
      : never
    : never = [];

  for (const file of inputs.flatMap(filesIn)) {
    const items: Item[] = JSON.parse(readFileSync(file, "utf-8"));
    for (const it of items) {
      stats.read++;
      const name = it.name?.trim();
      if (!name) continue;

      const website = cleanWebsite(it.website);
      const email = it.email?.trim().toLowerCase() || null;
      if (!website && !(email && isBusinessEmail(email))) {
        stats.noDomain++;
        continue;
      }
      if (!it.type || !validTypes.has(it.type)) {
        stats.badType++;
        continue;
      }
      const stateSlug = it.state ? stateSlugFor(it.state) : null;
      const stateId = stateSlug ? stateIds.get(stateSlug) : undefined;
      if (!stateSlug || !stateId) {
        stats.badState++;
        continue;
      }

      const slug = slugify(name).slice(0, 80);
      const host = website ? new URL(website).hostname.replace(/^www\./, "") : null;
      if (takenSlug.has(`${stateId}:${slug}`) || (host && takenHost.has(host))) {
        stats.duplicate++;
        continue;
      }
      takenSlug.add(`${stateId}:${slug}`);
      if (host) takenHost.add(host);

      const city = it.city ? CITIES.find((c) => c.stateSlug === stateSlug && slugify(c.name) === slugify(it.city!)) : undefined;
      rows.push({
        slug,
        name,
        stateId,
        cityId: city ? (cityIds.get(`${stateId}:${city.slug}`) ?? null) : null,
        cityName: city?.name ?? it.city?.trim() ?? null,
        type: it.type,
        website,
        email: email && isBusinessEmail(email) ? email : null,
        phone: it.phone?.trim() || null,
        address: it.address?.trim() || null,
      });
    }
  }

  console.log("Read", stats.read, "| no website/domain:", stats.noDomain, "| unknown type:", stats.badType, "| unknown state:", stats.badState, "| duplicates:", stats.duplicate);
  console.log(`Importable: ${rows.length}`);
  if (DRY) return;

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    inserted += (await db.company.createMany({ data: rows.slice(i, i + 500), skipDuplicates: true })).count;
  }
  console.log(`Added ${inserted} companies.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
