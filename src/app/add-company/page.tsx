import type { Metadata } from "next";
import AddCompanyForm from "@/components/AddCompanyForm";

export const metadata: Metadata = {
  title: "Add your company information | Bidcore",
  description: "Add your company details to Bidcore. Companies with an active Bidcore subscription are listed on Bidcore.in.",
  robots: { index: false, follow: true },
};

export default function AddCompanyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">Add your company information</h1>
      <p className="mt-2 text-slate-600">
        Tell Bidcore about your company. Your details are saved to your Bidcore account, and your company is listed under Explore &rarr; Companies on Bidcore.in as soon
        as it has an active Bidcore subscription. Contact details are never shown publicly.
      </p>
      <div className="mt-8">
        <AddCompanyForm />
      </div>
    </div>
  );
}
