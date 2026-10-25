import { notFound } from "next/navigation";
import Link from "next/link";
import DirectoryList from "@/components/DirectoryList";
import { countCompanies } from "@/lib/company-queries";
import { getState, getCitiesForState } from "@/lib/data";

export default async function StateDirectoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { state: stateSlug } = await params;
  const state = getState(stateSlug);
  if (!state) notFound();

  const cities = getCitiesForState(stateSlug);
  const count = await countCompanies({ state: stateSlug });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/states" className="hover:text-brand-navy">
          States
        </Link>{" "}
        / <span className="text-slate-700">{state.name}</span>
      </nav>

      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        Construction Companies in {state.name}
      </h1>

      <div className="mt-6">
        {count === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              We&apos;re still building the {state.name} directory.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Know a construction company here? Invite it to Bidcore.
            </p>
            <div className="mt-5">
              <Link
                href="/invite"
                className="inline-block rounded-md bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
              >
                Invite a Company
              </Link>
            </div>
          </div>
        ) : (
          <DirectoryList
            searchParams={searchParams}
            lock={{ state: stateSlug }}
            showCityFilter
            cityOptions={cities}
          />
        )}
      </div>
    </div>
  );
}
