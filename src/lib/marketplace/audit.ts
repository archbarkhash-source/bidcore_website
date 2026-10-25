import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function audit(
  entityType: string,
  entityId: string,
  action: string,
  actor: { id: string; email: string } | null,
  detail?: Prisma.InputJsonValue,
) {
  try {
    await db.marketplaceAudit.create({
      data: { entityType, entityId, action, actorId: actor?.id ?? null, actorEmail: actor?.email ?? null, detail },
    });
  } catch (e) {
    // An audit failure must not undo the change that was already made, but it must be visible in the logs.
    console.error("[marketplace] audit write failed:", (e as Error).message);
  }
}
