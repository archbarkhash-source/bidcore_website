import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "@/lib/email-domain";
import { sendMail } from "@/lib/mail";
import { allow } from "@/lib/rate-limit";
import { COUNTRIES } from "@/lib/roles";
import { saveRequest } from "@/lib/software-requests";
import { MACHINE_CODE } from "@/lib/software-requests-schema";
import { productOf } from "@/lib/software";

export const dynamic = "force-dynamic";

const clean = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

// "Request the yearly subscription" for an installable program: saved in this site's database and e-mailed to the owner (SOFTWARE_TO_EMAIL, else DEMO_TO_EMAIL, else
// the demo inbox). No confirmation is mailed to the requester, so the form cannot be used to mail third parties.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (clean(body.website)) return NextResponse.json({ ok: true }); // honeypot

  const caller = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(`software:${caller}`, 5)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const product = productOf(clean(body.product, 40));
  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  const phone = clean(body.phone, 40);
  const company = clean(body.company, 160);
  const country = clean(body.country, 80);
  const machineCode = clean(body.machineCode, 40).toUpperCase() || null;
  const message = clean(body.message, 2000) || null;

  if (!product) return NextResponse.json({ error: "Choose the program from the list.", field: "product" }, { status: 400 });
  if (!name || !email || !phone || !company || !country) return NextResponse.json({ error: "Name, email, phone, company and country are required." }, { status: 400 });
  if (!COUNTRIES.some((c) => c.label === country)) return NextResponse.json({ error: "Choose your country from the list.", field: "country" }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "Enter a valid email address.", field: "email" }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Enter a valid phone number.", field: "phone" }, { status: 400 });
  if (machineCode && !MACHINE_CODE.test(machineCode)) {
    return NextResponse.json({ error: "The computer code looks like ABCD-1234-EFGH-5678-IJKL. Copy it from the program (Settings > Product Licence), or leave it blank.", field: "machineCode" }, { status: 400 });
  }

  let id: number;
  try {
    id = await saveRequest({ product: product.key, name, email, phone, company, country, machineCode, message });
  } catch {
    return NextResponse.json({ error: "Your request could not be saved right now. Please try again shortly." }, { status: 503 });
  }

  const rows: [string, string][] = [
    ["Request", `#${id}`],
    ["Program", `${product.name} (${product.key})`],
    ["Plan", "Yearly subscription (1 year)"],
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["Company", company],
    ["Country", country],
    ["Computer code", machineCode ?? "- (licence for any computer)"],
    ["Message", message ?? "-"],
  ];
  try {
    await sendMail({
      to: process.env.SOFTWARE_TO_EMAIL || process.env.DEMO_TO_EMAIL || "barkha@bidcoreai.com",
      replyTo: email,
      subject: `Software subscription request #${id}: ${product.name} - ${company}`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      html: `<table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("")}</table>`,
    });
  } catch {
    // the request is saved in the database; the owner finds it with `npm run requests`. The visitor is not told about a mail problem.
  }
  return NextResponse.json({ ok: true, id });
}
