// The owner's view of the subscription requests for the installable programs (table software_requests in this site's database).
//   npm run requests                          -> the requests still to do (status new / paid)
//   npm run requests -- list --all            -> every request
//   npm run requests -- show 12               -> one request, with the licence command to run
//   npm run requests -- paid 12 [--ref RZP123] -> note that the yearly subscription was paid (payment_status = paid)
//   npm run requests -- issued 12 --licence BC-XXXX [--note "sent by email"]   -> note that the licence was issued
// The licence itself is made with desktop/license-generator (node generate.js issue ...); the command below is printed ready to copy.
import { resolve } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { REQUESTS_SQL } from "../src/lib/software-requests-schema";

interface Row {
  id: number;
  created_at: Date;
  product: string;
  years: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  machine_code: string | null;
  message: string | null;
  status: string;
  payment_status: string;
  payment_ref: string | null;
  license_id: string | null;
  notes: string | null;
}

const flag = (args: string[], name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

function licenceCommand(r: Row): string {
  const q = (s: string) => `"${s.replace(/"/g, '\\"')}"`;
  return `node generate.js issue --product ${r.product} --licensee ${q(`${r.company} (${r.name})`)} --email ${r.email} --days ${365 * r.years}${r.machine_code ? ` --machine ${r.machine_code}` : ""} --out C:\\temp\\${r.product}-${r.id}.bidcorelicense`;
}

async function main() {
  try {
    process.loadEnvFile(resolve(__dirname, "../.env")); // DATABASE_URL (a variable already set in the shell wins)
  } catch {
    /* DATABASE_URL may already be set */
  }
  const [cmd = "list", ...rest] = process.argv.slice(2);
  const db = new PrismaClient();
  try {
    for (const sql of REQUESTS_SQL) await db.$executeRawUnsafe(sql);
    if (cmd === "list") {
      const rows = await db.$queryRawUnsafe<Row[]>(
        rest.includes("--all") ? `SELECT * FROM software_requests ORDER BY id DESC LIMIT 200` : `SELECT * FROM software_requests WHERE status IN ('new', 'paid') ORDER BY id`,
      );
      if (!rows.length) console.log("No requests.");
      for (const r of rows) console.log(`#${r.id}  ${r.created_at.toISOString().slice(0, 10)}  ${r.status.padEnd(7)} ${r.payment_status.padEnd(7)} ${r.product.padEnd(15)} ${r.company} - ${r.name} <${r.email}>`);
      return;
    }
    const id = Number(rest[0]);
    if (!Number.isInteger(id)) throw new Error("usage: npm run requests -- show|paid|issued <id>");
    const found = await db.$queryRawUnsafe<Row[]>(`SELECT * FROM software_requests WHERE id = $1`, id);
    if (!found[0]) throw new Error(`No request #${id}`);
    if (cmd === "show") {
      const r = found[0];
      console.log(JSON.stringify({ ...r, created_at: r.created_at.toISOString() }, null, 2));
      console.log(`\nIssue the licence (run in bidcoreai/desktop/license-generator):\n  ${licenceCommand(r)}`);
    } else if (cmd === "paid") {
      await db.$executeRawUnsafe(`UPDATE software_requests SET payment_status = 'paid', payment_ref = $2, status = CASE WHEN status = 'new' THEN 'paid' ELSE status END WHERE id = $1`, id, flag(rest, "ref") ?? null);
      console.log(`#${id} marked paid.`);
    } else if (cmd === "issued") {
      const lic = flag(rest, "licence");
      if (!lic) throw new Error("--licence <licence id> is required (the id printed by generate.js issue).");
      await db.$executeRawUnsafe(`UPDATE software_requests SET status = 'issued', license_id = $2, issued_at = now(), notes = $3 WHERE id = $1`, id, lic, flag(rest, "note") ?? null);
      console.log(`#${id} marked issued (${lic}).`);
    } else {
      throw new Error(`unknown command ${cmd}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
