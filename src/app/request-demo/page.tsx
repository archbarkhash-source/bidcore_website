import type { Metadata } from "next";
import Link from "next/link";
import DemoRequestForm from "@/components/DemoRequestForm";

export const metadata: Metadata = {
  title: "Request a Demo | Bidcore",
  description: "See how BidcoreAI works for EPC contractors and subcontractors: tendering, estimating, planning and project management. Tell us about your company and we will get in touch.",
  alternates: { canonical: "/request-demo" },
};

export default async function RequestDemoPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">Request a Demo</h1>
      <p className="mt-3 text-slate-600">
        See how BidcoreAI works for EPC contractors and subcontractors. Tell us a little about your company and the Bidcore team will get in touch.
      </p>
      <p className="mt-3 inline-block rounded-md bg-orange-50 px-3 py-2 text-sm font-medium text-slate-800 ring-1 ring-orange-200">
        A Bidcore team member is ready to give you a live demo on the date and time you choose (IST).
      </p>
      <p className="mt-3 text-sm text-slate-600">
        Want a look first?{" "}
        <Link href="/live-demo" className="font-medium text-brand-accent hover:underline">
          Watch the live demo videos
        </Link>
        .
      </p>
      <div className="mt-8">
        <DemoRequestForm initialInterest={product} />
      </div>
    </div>
  );
}
