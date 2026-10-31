// Creates the directory tables (if missing) and loads the contractor CSVs into the database named by DATABASE_URL.
// Idempotent: run it again after editing a CSV; a company is matched by its website host (or name + city), and a company switched off (listed = false) stays off.
//   npm run directory:import                    -> every data/directory/*.csv
//   npm run directory:import -- --dry-run       -> shows what would change, writes nothing
//   npm run directory:import -- data/directory/mumbai.csv
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { DIRECTORY_SCHEMA_SQL } from "../src/lib/directory-schema";
import { DIRECTORY_TYPES, cleanEmail, cleanPhone, keyOf, normaliseWebsite, slugify } from "../src/lib/directory-core";
import { parseCsv } from "../src/lib/marketplace/csv";

const DEFAULT_STATE: Record<string, string> = { mumbai: "Maharashtra", delhi: "Delhi", "new delhi": "Delhi" };

function readRows(path: string): Record<string, string>[] {
  const [head, ...rows] = parseCsv(readFileSync(path, "utf8"));
  const cols = head.map((h) => h.trim());
  return rows.map((r) => Object.fromEntries(cols.map((c, i) => [c, (r[i] ?? "").trim()])));
}

async function main() {
  try {
    process.loadEnvFile(resolve(__dirname, "../.env")); // DATABASE_URL from the site's own .env (a variable already set in the shell wins)
  } catch {
    /* no .env file: DATABASE_URL must already be set */
  }
  const args = process.argv.slice(2);
  const dry = args.includes("--dry-run");
  const files = args.filter((a) => !a.startsWith("--"));
  const dir = resolve(__dirname, "../data/directory");
  const paths = files.length ? files.map((f) => resolve(f)) : readdirSync(dir).filter((f) => f.endsWith(".csv")).map((f) => join(dir, f));

  const url = new URL(process.env.DATABASE_URL ?? "postgresql://missing");
  console.log(`Database: ${url.hostname} / ${url.pathname.replace("/", "")}${dry ? "  (dry run: nothing is written)" : ""}`);
  const db = new PrismaClient();
  try {
    if (!dry) for (const sql of DIRECTORY_SCHEMA_SQL) await db.$executeRawUnsafe(sql);
    const existing = dry
      ? []
      : await db.$queryRawUnsafe<{ key: string; slug: string }[]>(`SELECT key, slug FROM directory_companies`).catch(() => []);
    const keys = new Set(existing.map((e) => e.key));
    const slugs = new Set(existing.map((e) => e.slug));
    const seen = new Set<string>();
    const counts = { created: 0, updated: 0, skipped: 0 };

    for (const path of paths) {
      for (const r of readRows(path)) {
        const name = r.name;
        const type = r.type;
        const city = r.city || "Mumbai";
        if (!name || !(DIRECTORY_TYPES as readonly string[]).includes(type)) {
          counts.skipped++;
          continue;
        }
        const key = keyOf(name, r.website, city);
        if (seen.has(key)) {
          counts.skipped++; // the same company twice
          continue;
        }
        seen.add(key);
        const isNew = !keys.has(key);
        let slug = `${slugify(name)}-${slugify(city)}`;
        for (let n = 2; isNew && slugs.has(slug); n++) slug = `${slugify(name)}-${slugify(city)}-${n}`;
        slugs.add(slug);
        isNew ? counts.created++ : counts.updated++;
        if (dry) continue;
        const trades = r.trades.split(/[;|]/).map((t) => t.trim()).filter(Boolean).slice(0, 12);
        await db.$executeRawUnsafe(
          `INSERT INTO directory_companies (key, slug, name, type, city, state, trades, website, email, phone, address, source_url, verified_on)
           VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8, $9, $10, $11, $12, $13::date)
           ON CONFLICT (key) DO UPDATE SET
             name = EXCLUDED.name, type = EXCLUDED.type, city = EXCLUDED.city, state = EXCLUDED.state, trades = EXCLUDED.trades,
             website = COALESCE(EXCLUDED.website, directory_companies.website), email = COALESCE(EXCLUDED.email, directory_companies.email),
             phone = COALESCE(EXCLUDED.phone, directory_companies.phone), address = COALESCE(EXCLUDED.address, directory_companies.address),
             source_url = COALESCE(EXCLUDED.source_url, directory_companies.source_url), verified_on = EXCLUDED.verified_on, updated_at = now()`,
          key,
          slug,
          name,
          type,
          city,
          r.state || DEFAULT_STATE[city.toLowerCase()] || null,
          trades,
          normaliseWebsite(r.website),
          cleanEmail(r.email),
          cleanPhone(r.phone),
          r.address || null,
          r.source_url || null,
          r.verified_on || new Date().toISOString().slice(0, 10),
        );
      }
    }
    console.log(`${dry ? "Would change" : "Done"}: created=${counts.created} updated=${counts.updated} skipped=${counts.skipped}`);
    if (!dry) {
      const byCity = await db.$queryRawUnsafe<{ city: string; type: string; n: bigint }[]>(
        `SELECT city, type, COUNT(*) AS n FROM directory_companies WHERE listed = TRUE GROUP BY city, type ORDER BY city, type`,
      );
      for (const b of byCity) console.log(`  ${b.city.padEnd(8)} ${b.type.padEnd(26)} ${Number(b.n)}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
