import type { Metadata } from "next";
import AddCompanyForm from "@/components/AddCompanyForm";

export const metadata: Metadata = {
  title: "List your company | Bidcore",
  description: "List your company on Bidcore so contractors can find you.",
  robots: { index: false, follow: true },
};

export default function AddCompanyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">List your company</h1>
      <p className="mt-2 text-slate-600">Contractors, builders, subcontractors, vendors and suppliers: list your company so contractors can find you.</p>
      <div className="mt-8">
        <AddCompanyForm />
      </div>
    </div>
  );
}
