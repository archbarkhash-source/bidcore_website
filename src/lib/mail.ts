import nodemailer from "nodemailer";

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("SMTP is not configured");
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 465),
    secure: SMTP_SECURE !== "false",
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

export async function sendVerificationCode(to: string, code: string) {
  const fromName = process.env.SMTP_FROM_NAME ?? "Bidcore";
  await transport().sendMail({
    from: `"${fromName}" <${process.env.SMTP_USER}>`,
    to,
    subject: `${code} is your ${fromName} verification code`,
    text: `Your ${fromName} verification code is ${code}.\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `<p>Your ${fromName} verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}

export async function sendMail(opts: { to: string; subject: string; text: string; html: string; replyTo?: string }) {
  const fromName = process.env.SMTP_FROM_NAME ?? "Bidcore";
  await transport().sendMail({ from: `"${fromName}" <${process.env.SMTP_USER}>`, ...opts });
}
