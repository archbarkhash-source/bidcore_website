import type { Metadata } from "next";
import AddListingForm from "@/components/AddListingForm";

export const metadata: Metadata = {
  title: "Add your listing | Bidcore",
  description: "List yourself as a construction professional, or list your equipment, so general contractors and subcontractors can find you.",
  robots: { index: false, follow: true },
};

export default async function AddListingPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">Add your listing</h1>
      <p className="mt-2 text-slate-600">
        Site engineer, QA engineer, surveyor or equipment owner? List yourself under Explore so general contractors and subcontractors can find you. It is free. Your contact details
        are shown only to signed-in members.
      </p>
      <div className="mt-8">
        <AddListingForm initialKind={kind === "equipment" ? "equipment" : "professional"} />
      </div>
    </div>
  );
}
