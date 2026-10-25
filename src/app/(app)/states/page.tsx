import StateCard from "@/components/StateCard";
import { countByState } from "@/lib/company-queries";
import { STATES } from "@/lib/data";

export const revalidate = 3600;

export default async function StatesPage() {
  const counts = await countByState();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Explore Construction Companies by State
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Discover contractors, developers and construction companies across India.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STATES.map((state) => (
          <StateCard key={state.slug} state={state} count={counts[state.slug]} />
        ))}
      </div>
    </div>
  );
}
