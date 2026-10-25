import DirectoryList from "@/components/DirectoryList";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Architects</h1>
      <p className="mt-1 text-sm text-slate-500">
        Explore architecture and design firms across India.
      </p>

      <div className="mt-6">
        <DirectoryList
          searchParams={searchParams}
          showStateFilter
          showCityFilter
            lock={{ type: "Architect" }}
            lockedType="Architect"
        />
      </div>
    </div>
  );
}
