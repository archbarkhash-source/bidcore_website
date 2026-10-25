import DirectoryList from "@/components/DirectoryList";

const CONTRACTOR_TYPES = [
  "General Contractor",
  "Civil Contractor",
  "Building Contractor",
  "Infrastructure Contractor",
  "EPC Contractor",
  "MEP Contractor",
  "Electrical Contractor",
  "Plumbing Contractor",
  "Structural Contractor",
  "Interior Contractor",
];

export default function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Contractors</h1>
      <p className="mt-1 text-sm text-slate-500">
        Find contractors across India — general, civil, structural, MEP and more.
      </p>

      <div className="mt-6">
        <DirectoryList
          searchParams={searchParams}
          lock={{ types: CONTRACTOR_TYPES }}
          showStateFilter
          showCityFilter
        />
      </div>
    </div>
  );
}
