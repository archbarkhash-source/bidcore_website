import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { revealDirectoryContact } from "@/lib/directory";
import { SESSION_COOKIE, readSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

// Contact details of a Bidcore directory company, for signed-in members only. They never ship in the public page: the page shows a masked copy, and this
// route reads the real one from the directory table, records the opening, and caps how many different companies one member can open in a day.
export async function GET(req: NextRequest) {
  const userId = readSessionUserId((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) return NextResponse.json({ error: "Sign up to view contact information." }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  const res = await revealDirectoryContact(slug, userId);
  return res.ok ? NextResponse.json({ contact: res.contact }) : NextResponse.json({ error: res.message }, { status: res.status });
}
