import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Download } from "lucide-react";
import { SOFTWARE, TRIAL_DAYS, downloadUrl } from "@/lib/software";

export const metadata: Metadata = {
  title: "Download Starter Lite software | Bidcore",
  description: `Bidcore Starter Lite programs for Windows: Tender Connect and Takeoff. They run on your own computer with a ${TRIAL_DAYS}-day free trial, then a yearly subscription.`,
  alternates: { canonical: "/software" },
};

export default function SoftwarePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-navy sm:text-4xl">Starter Lite software for Windows</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Install it on your own computer. Your projects stay on your computer and the program works offline. Every program starts with a {TRIAL_DAYS}-day free trial, with no card. When the trial ends the program stops
          opening until you add the yearly subscription. Your data is never deleted.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {SOFTWARE.map((p) => (
          <div key={p.key} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-brand-navy">{p.name}</h2>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{p.country}</p>
            <p className="mt-3 text-sm text-slate-600">{p.blurb}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-semibold text-brand-navy">{TRIAL_DAYS}-day free trial, then a yearly subscription</p>
            {p.available ? (
              <a href={downloadUrl(p)} className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light">
                <Download className="h-4 w-4" /> Download for Windows
              </a>
            ) : (
              <span className="mt-4 block rounded-full bg-slate-100 px-5 py-2.5 text-center text-sm font-semibold text-slate-500">Download coming soon</span>
            )}
            <Link href={`/request-software?product=${p.key}`} className="mt-2 block rounded-full border border-slate-300 px-5 py-2.5 text-center text-sm font-semibold text-brand-navy transition hover:border-slate-400">
              Request the yearly subscription
            </Link>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Download and install the program. It starts your {TRIAL_DAYS}-day free trial the first time you open it.</li>
          <li>Create your local account and start working. Everything is saved on your computer.</li>
          <li>Before the trial ends, request the yearly subscription. You receive a licence file by email; open the program, choose Import licence file, and carry on.</li>
        </ol>
        <p className="mt-3">Windows may show a warning for a new installer (SmartScreen). Choose More info, then Run anyway.</p>
      </div>
    </div>
  );
}
