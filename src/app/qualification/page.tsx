import QualificationForm from "@/components/QualificationForm";

export default function QualificationPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">
        Add Your Company Qualification
      </h1>
      <p className="mt-2 text-slate-600">
        Licenses, certifications and track record — the details that let developers and GCs
        qualify your company for invitations to bid.
      </p>

      <div className="mt-8">
        <QualificationForm />
      </div>
    </div>
  );
}
