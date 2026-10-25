import Link from "next/link";
import { CalendarClock, MapPin, Building2, Tag } from "lucide-react";
import { type Tender, daysLeft, formatDate, formatValue } from "@/lib/bidcore-api";

export function StatusBadge({ tender }: { tender: Pick<Tender, "status" | "closing_date"> }) {
  const left = daysLeft(tender.closing_date);
  if (tender.status === "closed") {
    return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">Closed</span>;
  }
  const soon = left !== null && left <= 5;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${soon ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
    >
      {left === null ? "Open" : left <= 0 ? "Closes today" : `${left} day${left === 1 ? "" : "s"} left`}
    </span>
  );
}

export default function TenderCard({ tender }: { tender: Tender }) {
  const value = formatValue(tender.value_inr);
  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 transition hover:border-brand-accent/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">{tender.reference_no ?? "Tender"}</p>
        <StatusBadge tender={tender} />
      </div>
      <h3 className="mt-2 text-base font-semibold leading-snug text-brand-navy">
        <Link href={`/tenders/${tender.slug}`} className="hover:text-brand-accent">
          {tender.title}
        </Link>
      </h3>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
        {tender.organization && (
          <li className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {tender.organization}
          </li>
        )}
        {tender.location && (
          <li className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {tender.location}
          </li>
        )}
        {tender.category && (
          <li className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {tender.category}
            {value && <span className="text-slate-400">·</span>}
            {value && <span className="font-medium text-slate-800">{value}</span>}
          </li>
        )}
        <li className="flex items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          Submission by {formatDate(tender.closing_date)}
          <span className="text-slate-400">· Published {formatDate(tender.published_at)}</span>
        </li>
      </ul>
      {tender.summary && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{tender.summary}</p>}
      <Link
        href={`/tenders/${tender.slug}`}
        className="mt-4 inline-block self-start rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
      >
        View Tender &amp; Prepare Quotation
      </Link>
    </article>
  );
}
