import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, readSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

// Contact details are only ever served to signed-in members. They are kept
// out of the static company data so they never ship to anonymous visitors.
export async function GET(req: NextRequest) {
  const userId = readSessionUserId((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) {
    return NextResponse.json({ error: "Sign up to view contact information." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state");
  const slug = searchParams.get("slug");
  if (!state || !slug) {
    return NextResponse.json({ error: "state and slug are required." }, { status: 400 });
  }

  const company = await db.company.findFirst({
    where: { slug, active: true, state: { slug: state } },
    select: { address: true, email: true, phone: true, website: true },
  });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  return NextResponse.json({ contact: company });
}
