import DirectoryList from "@/components/DirectoryList";
import { SUPPLIER_TYPES } from "@/lib/data";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
      <p className="mt-1 text-sm text-slate-500">
        Electrical, building material, steel and cement, plumbing, tiles, paints and more — suppliers across India.
      </p>

      <div className="mt-6">
        <DirectoryList
          searchParams={searchParams}
          showStateFilter
          showCityFilter
            lock={{ types: SUPPLIER_TYPES }}
        />
      </div>
    </div>
  );
}
