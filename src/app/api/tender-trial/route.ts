import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, readSessionUserId } from "@/lib/session";

// Starts the free period for Tender Invite on the signed-in member.
// Calling it again never restarts an existing one.
export async function POST() {
  const userId = readSessionUserId((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  await db.user.updateMany({
    where: { id: userId, tenderTrialStartedAt: null },
    data: { tenderTrialStartedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
