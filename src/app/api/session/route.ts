import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, readSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = readSessionUserId((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) return NextResponse.json({ user: null });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, companyName: true, tenderTrialStartedAt: true },
  });
  return NextResponse.json({ user });
}
