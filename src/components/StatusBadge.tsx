const TONES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  dormant: "bg-amber-50 text-amber-700",
  "under process of striking off": "bg-amber-50 text-amber-700",
  amalgamated: "bg-slate-100 text-slate-600",
};

export default function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-xs text-slate-400">—</span>;
  const tone = TONES[status.toLowerCase()] ?? "bg-red-50 text-red-700";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}
