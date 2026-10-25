import Link from "next/link";
import { MapPin } from "lucide-react";
import { StateInfo } from "@/lib/types";

export default function StateCard({ state, count = 0 }: { state: StateInfo; count?: number }) {

  return (
    <Link
      href={`/states/${state.slug}`}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-navy/30 hover:shadow-md"
    >
      <span className="flex items-center gap-2.5">
        <MapPin className="h-4 w-4 text-slate-400" />
        <span className="font-medium text-slate-900">{state.name}</span>
      </span>
      {count > 0 && (
        <span className="text-xs font-medium text-slate-400">{count.toLocaleString("en-IN")} companies</span>
      )}
    </Link>
  );
}
