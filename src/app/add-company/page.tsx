import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signUpHref } from "@/lib/app-links";
import AddCompanyForm from "@/components/AddCompanyForm";

export const metadata: Metadata = {
  title: "Add your company information | Bidcore",
  description: "Add your company to the Bidcore company network so EPC and general contractors can find you on Tender Connect. Companies with an active Bidcore subscription are listed on Bidcore.in.",
  robots: { index: false, follow: true },
};

export default function AddCompanyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">Add your company to the Bidcore directory</h1>
      <p className="mt-2 text-slate-600">
        Add your company to the Bidcore company network so EPC and general contractors can find you, and invite you to tender, when they add tenderers on Tender Connect. Your
        company is saved in the Bidcore directory and in the BidcoreAI contractor database, and is listed under Explore &rarr; Companies on Bidcore.in as soon as it has an active
        Bidcore subscription. Contact details are never shown publicly.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        This is separate from the Marketplace. To promote products or services, use{" "}
        <Link href="/marketplace/list-your-business" className="font-medium text-brand-accent hover:underline">
          List Your Business
        </Link>
        .
      </p>
      <div className="mt-5 flex flex-col gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-brand-navy">Looking for tenders to quote on?</span> Find opportunities on Tender Connect, with a free 7-day trial.
        </p>
        <a href={signUpHref("tender-connect")} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
          Find opportunities, sign up free <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="mt-8">
        <AddCompanyForm />
      </div>
    </div>
  );
}
