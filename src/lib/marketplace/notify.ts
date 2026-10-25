import "server-only";
import { sendMail } from "@/lib/mail";
import { SITE_URL } from "@/lib/bidcore-api";
import { MP } from "./constants";

// Best-effort e-mail. SMTP not being configured must never make an enquiry or a moderation action fail: the row is already saved and visible in the dashboard.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function send(to: string, subject: string, lines: string[]) {
  try {
    const text = lines.join("\n");
    const html = lines.map((l) => `<p style="margin:0 0 10px">${esc(l).replace(/\n/g, "<br>")}</p>`).join("");
    await sendMail({ to, subject, text, html });
  } catch (e) {
    console.warn("[marketplace] e-mail not sent:", (e as Error).message);
  }
}

export interface EnquiryMail {
  ref: string;
  subject: string; // what the enquiry is about
  buyerName: string;
  buyerCompany?: string | null;
  buyerEmail: string;
  buyerPhone?: string | null;
  quantity?: string | null;
  location?: string | null;
  timeline?: string | null;
  message: string;
}

export function notifySupplier(to: string, claimed: boolean, e: EnquiryMail) {
  return send(to, `New enquiry ${e.ref}: ${e.subject}`, [
    `You have a new enquiry on the Bidcore marketplace about: ${e.subject}`,
    `From: ${e.buyerName}${e.buyerCompany ? `, ${e.buyerCompany}` : ""}`,
    `Email: ${e.buyerEmail}${e.buyerPhone ? `\nPhone: ${e.buyerPhone}` : ""}`,
    ...(e.quantity ? [`Quantity: ${e.quantity}`] : []),
    ...(e.location ? [`Location: ${e.location}`] : []),
    ...(e.timeline ? [`Timeline: ${e.timeline}`] : []),
    `Message:\n${e.message}`,
    claimed
      ? `Reply and manage this enquiry in your dashboard: ${SITE_URL}${MP}/dashboard/enquiries`
      : `Your company profile on Bidcore has not been claimed yet. Claim it to respond and manage enquiries: ${SITE_URL}${MP}/list-your-business`,
  ]);
}

export function confirmToBuyer(e: EnquiryMail, supplierName: string, sharedFields: string[]) {
  return send(e.buyerEmail, `We sent your enquiry to ${supplierName} (${e.ref})`, [
    `Hello ${e.buyerName},`,
    `Your enquiry about "${e.subject}" has been sent to ${supplierName}. Your reference is ${e.ref}.`,
    `Shared with the supplier: ${sharedFields.join(", ")}.`,
    `The supplier will reply to ${e.buyerEmail}. Bidcore does not guarantee a response or a price.`,
  ]);
}

export function sendReplyToBuyer(to: string, ref: string, supplierName: string, body: string) {
  return send(to, `Reply from ${supplierName} to your enquiry ${ref}`, [`${supplierName} replied to your enquiry ${ref}:`, body, `Reply directly to this email thread or contact the supplier using the details they gave.`]);
}
