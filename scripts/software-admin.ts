// The owner's controls for installed programs that use bidcore.in (tables software_activations / software_licence_revocations / software_api_log).
//   npm run software -- activations [BC-XXXX]          -> computers activated (all, or for one licence)
//   npm run software -- revoke BC-XXXX [reason words]  -> the licence can no longer use any website service (takes effect on the next call)
//   npm run software -- unrevoke BC-XXXX
//   npm run software -- deactivate 12                  -> frees that computer's seat and ends its access token (it may activate again if a seat is free)
//   npm run software -- log [50]                       -> the latest calls (accepted and refused)
import { resolve } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { SOFTWARE_SCHEMA_SQL } from "../src/lib/software-schema";

async function main() {
  try {
    process.loadEnvFile(resolve(__dirname, "../.env"));
  } catch {}
  const db = new PrismaClient();
  const [cmd = "activations", arg, ...rest] = process.argv.slice(2);
  try {
    for (const sql of SOFTWARE_SCHEMA_SQL) await db.$executeRawUnsafe(sql);
    if (cmd === "activations") {
      const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT a.id, a.licence_id, a.product, a.licensee, a.machine, a.app_version, a.licence_expires_at::date AS licence_ends, a.last_seen_at,
                a.deactivated_at IS NOT NULL AS deactivated, r.licence_id IS NOT NULL AS revoked
           FROM software_activations a LEFT JOIN software_licence_revocations r ON r.licence_id = a.licence_id
          WHERE $1::text IS NULL OR a.licence_id = $1 ORDER BY a.last_seen_at DESC`,
        arg ?? null,
      );
      console.table(rows);
    } else if (cmd === "revoke" && arg) {
      await db.$executeRawUnsafe(
        `INSERT INTO software_licence_revocations (licence_id, reason) VALUES ($1, $2) ON CONFLICT (licence_id) DO UPDATE SET reason = EXCLUDED.reason, revoked_at = now()`,
        arg,
        rest.join(" ") || null,
      );
      console.log(`${arg} revoked.`);
    } else if (cmd === "unrevoke" && arg) {
      const n = await db.$executeRawUnsafe(`DELETE FROM software_licence_revocations WHERE licence_id = $1`, arg);
      console.log(n ? `${arg} is no longer revoked.` : `${arg} was not revoked.`);
    } else if (cmd === "deactivate" && arg && /^\d+$/.test(arg)) {
      const n = await db.$executeRawUnsafe(`UPDATE software_activations SET deactivated_at = now(), token_hash = NULL WHERE id = $1`, Number(arg));
      console.log(n ? `Activation ${arg} deactivated.` : `No activation ${arg}.`);
    } else if (cmd === "log") {
      const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT at, endpoint, status, activation_id, licence_id, detail FROM software_api_log ORDER BY id DESC LIMIT ${Math.min(Number(arg) || 50, 500)}`,
      );
      console.table(rows);
    } else {
      console.log("Usage: npm run software -- activations [licence] | revoke <licence> [reason] | unrevoke <licence> | deactivate <id> | log [n]");
      process.exitCode = 1;
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
