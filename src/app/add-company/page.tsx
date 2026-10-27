import type { Metadata } from "next";
import Link from "next/link";
import AddCompanyForm from "@/components/AddCompanyForm";

export const metadata: Metadata = {
  title: "Add your company information | Bidcore",
  description: "Add your company to the Bidcore company network so EPC and general contractors can find you on Tender Connect. Companies with an active Bidcore subscription are listed on Bidcore.in.",
  robots: { index: false, follow: true },
};

export default function AddCompanyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">Add your company information</h1>
      <p className="mt-2 text-slate-600">
        Add your company to the Bidcore company network so EPC and general contractors can find you, and invite you to tender, when they add tenderers on Tender Connect. Your
        details are saved to your Bidcore account, and your company is listed under Explore &rarr; Companies on Bidcore.in as soon as it has an active Bidcore subscription.
        Contact details are never shown publicly.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        This is separate from the Marketplace. To promote products or services, use{" "}
        <Link href="/marketplace/list-your-business" className="font-medium text-brand-accent hover:underline">
          List Your Business
        </Link>
        .
      </p>
      <div className="mt-8">
        <AddCompanyForm />
      </div>
    </div>
  );
}
