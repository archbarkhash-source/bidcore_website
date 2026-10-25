import { Suspense } from "react";
import CompanyDirectory from "@/components/CompanyDirectory";
import { DirectoryFilters, PAGE_SIZE, listCompanies, parseFilters } from "@/lib/company-queries";
import { CompanyType } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

// Server-side wrapper: reads the URL filters, queries one page of companies
// from the database and hands it to the interactive table.
export default async function DirectoryList({
  searchParams,
  lock,
  lockedType,
  showStateFilter,
  showCityFilter,
  cityOptions,
}: {
  searchParams: Promise<SearchParams>;
  lock?: Partial<DirectoryFilters>;
  lockedType?: CompanyType;
  showStateFilter?: boolean;
  showCityFilter?: boolean;
  cityOptions?: { slug: string; name: string }[];
}) {
  const filters = parseFilters(await searchParams, lock);
  const { companies, total, page, pageCount } = await listCompanies(filters);

  return (
    <Suspense fallback={null}>
      <CompanyDirectory
        companies={companies}
        total={total}
        page={page}
        pageCount={pageCount}
        pageSize={PAGE_SIZE}
        showStateFilter={showStateFilter}
        showCityFilter={showCityFilter}
        cityOptions={cityOptions}
        lockedType={lockedType}
      />
    </Suspense>
  );
}
