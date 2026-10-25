import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support | Bidcore",
  description: "Contact the Bidcore team about your listing, claim verification, data corrections or general questions.",
  alternates: { canonical: "/help" },
};

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@bidcore.in";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Help &amp; Support</h1>
      <p className="mt-1 text-sm text-slate-500">
        Have a question about your listing or the network? Reach out and we&apos;ll help.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-700">
          For claim verification, data corrections or general questions, email the Bidcore team and describe your request.
        </p>
        <p className="mt-4 text-sm font-semibold text-slate-900">Contact</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 inline-block text-sm font-medium text-brand-accent hover:underline">
          {CONTACT_EMAIL}
        </a>
      </div>
    </div>
  );
}
