import type { Metadata } from "next";
import SoftwareRequestForm from "@/components/SoftwareRequestForm";
import { TRIAL_DAYS } from "@/lib/software";

export const metadata: Metadata = {
  title: "Request the yearly subscription | Bidcore",
  description: `Request the yearly subscription for the Bidcore Starter Lite programs. Every program starts with a ${TRIAL_DAYS}-day free trial.`,
  alternates: { canonical: "/request-software" },
  robots: { index: false, follow: true },
};

export default async function RequestSoftwarePage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">Request the yearly subscription</h1>
      <p className="mt-3 text-slate-600">
        Every Bidcore program installs on your computer and starts with a {TRIAL_DAYS}-day free trial. When the trial ends the program stops opening until the yearly subscription
        is added. Tell us about your company and the Bidcore team will send the subscription details and your licence.
      </p>
      <div className="mt-8">
        <SoftwareRequestForm initialProduct={product} />
      </div>
    </div>
  );
}
