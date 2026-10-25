import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "@/lib/email-domain";
import { sendMail } from "@/lib/mail";
import { DEMO_INTERESTS, DEMO_ROLES, isDemoDate } from "@/lib/demo";
import { allow } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const clean = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

// "Request a Demo": the details go by e-mail to the Bidcore team (TO_EMAIL, else the public contact address). Nothing is stored here and no confirmation is sent
// to the requester, so the form cannot be used to mail third parties.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field. Pretend success so a bot learns nothing.
  if (clean(body.website)) return NextResponse.json({ ok: true });

  const caller = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(`demo:${caller}`, 5)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  const phone = clean(body.phone, 40);
  const company = clean(body.company, 160);
  const role = clean(body.role, 80);
  const interest = clean(body.interest, 80);
  const message = clean(body.message, 2000);
  const preferredDate = clean(body.preferredDate, 10);

  if (!name || !email || !phone || !company) {
    return NextResponse.json({ error: "Name, work email, phone and company are required." }, { status: 400 });
  }
  if (!isValidEmail(email)) return NextResponse.json({ error: "Enter a valid email address.", field: "email" }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Enter a valid phone number.", field: "phone" }, { status: 400 });
  if (role && !DEMO_ROLES.includes(role)) return NextResponse.json({ error: "Choose who you are from the list.", field: "role" }, { status: 400 });
  if (interest && !DEMO_INTERESTS.includes(interest)) return NextResponse.json({ error: "Choose a product from the list.", field: "interest" }, { status: 400 });

  // Today's date in India (the team's calendar), not the server's time zone.
  const todayIst = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  if (preferredDate && !isDemoDate(preferredDate, todayIst)) {
    return NextResponse.json({ error: "Live demos are on Tuesdays and Fridays. Choose one of those dates.", field: "preferredDate" }, { status: 400 });
  }
  const preferredLabel = preferredDate
    ? new Date(`${preferredDate}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : "";

  const to = process.env.TO_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  if (!to) {
    console.error("[demo-request] no TO_EMAIL / NEXT_PUBLIC_CONTACT_EMAIL configured");
    return NextResponse.json({ error: "We couldn't send your request right now. Please email us instead." }, { status: 503 });
  }

  const rows: [string, string][] = [
    ["Name", name],
    ["Work email", email],
    ["Phone", phone],
    ["Company", company],
    ["I am a", role || "-"],
    ["Interested in", interest || "-"],
    ["Preferred demo date", preferredLabel || "-"],
    ["Message", message || "-"],
  ];
  try {
    await sendMail({
      to,
      replyTo: email,
      subject: `Demo request: ${company} (${interest || "not specified"})`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      html: `<h2>Demo request</h2><table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`,
    });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error("[demo-request] e-mail failed:", e.code, e.message);
    return NextResponse.json({ error: "We couldn't send your request right now. Please email us instead." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
