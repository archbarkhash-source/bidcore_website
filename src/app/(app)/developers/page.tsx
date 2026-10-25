import DirectoryList from "@/components/DirectoryList";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Developers</h1>
      <p className="mt-1 text-sm text-slate-500">
        Explore real estate and property developers across India.
      </p>

      <div className="mt-6">
        <DirectoryList
          searchParams={searchParams}
          showStateFilter
          showCityFilter
            lock={{ type: "Real Estate Developer" }}
            lockedType="Real Estate Developer"
        />
      </div>
    </div>
  );
}
