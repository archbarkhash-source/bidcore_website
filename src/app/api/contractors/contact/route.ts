import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { fetchDirectoryContact } from "@/lib/directory-contact";
import { SESSION_COOKIE, readSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

// Contact details of a Bidcore directory company, for signed-in members only. They never ship in the public page or the public API: the page shows a masked
// copy, and this route asks the BidcoreAI backend for the real one on the member's behalf (signed, audited, capped per member per day).
export async function GET(req: NextRequest) {
  const userId = readSessionUserId((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) return NextResponse.json({ error: "Sign up to view contact information." }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  const res = await fetchDirectoryContact(slug, userId);
  if (res.ok) return NextResponse.json({ contact: res.contact });
  if (res.status === 429) return NextResponse.json({ error: res.message ?? "You have reached today's limit for viewing contact details." }, { status: 429 });
  if (res.status === 404) return NextResponse.json({ error: "No contact details are listed for this company." }, { status: 404 });
  return NextResponse.json({ error: "Contact details are temporarily unavailable. Please try again in a few minutes." }, { status: 503 });
}
