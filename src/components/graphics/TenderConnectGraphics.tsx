import { CalendarClock, FileSpreadsheet, FileText, Mail, UserPlus } from "lucide-react";

// Product illustrations for Tender Connect. They are drawings of the screens' structure (tabs, bidder rows, quotation columns, opportunity stages), not screenshots,
// and use only neutral labels - no real company names, tenders, prices or statistics. Replace with real screenshots when they exist.

export function Bar({ w, className = "" }: { w: string; className?: string }) {
  return <div className={`h-2.5 rounded-full bg-slate-200 ${className}`} style={{ width: w }} />;
}

export type Tone = "green" | "amber" | "slate" | "blue";
export function Pill({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  const t = { green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", slate: "bg-slate-100 text-slate-500", blue: "bg-blue-50 text-blue-700" }[tone];
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${t}`}>{children}</span>;
}

// A small card floating around the main panel, in the style of the product tour graphics: filled for messages, outlined for documents and dates.
export function Float({ icon: Icon, title, sub, filled, className }: { icon: typeof Mail; title: string; sub: string; filled?: boolean; className: string }) {
  return (
    <div
      className={`absolute hidden items-center gap-2 rounded-md border px-3 py-2 shadow-lg sm:flex ${
        filled ? "border-blue-500 bg-[#1b4a94] text-white" : "border-sky-300 bg-white text-slate-800"
      } ${className}`}
    >
      <Icon className={`h-4 w-4 ${filled ? "text-white" : "text-sky-600"}`} />
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-semibold">{title}</span>
        <span className={`block text-[10px] ${filled ? "text-blue-100" : "text-slate-500"}`}>{sub}</span>
      </span>
    </div>
  );
}

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[34rem] px-2 py-8 sm:px-8">
      {children}
      <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-slate-400/80">Illustration</p>
    </div>
  );
}

/** Publisher side: one tender package, its bidders and their status. */
export function BiddersBoardGraphic() {
  const rows: [string, string, Tone, string][] = [
    ["Bidder A", "72%", "green", "Quoted"],
    ["Bidder B", "58%", "blue", "Invited"],
    ["Bidder C", "66%", "green", "Quoted"],
    ["Bidder D", "49%", "amber", "Viewing"],
  ];
  return (
    <Frame>
      <Float icon={UserPlus} title="New bidder" sub="Public tender" className="-top-1 left-0" />
      <Float icon={Mail} title="Invitation sent" sub="Private tender" filled className="-right-1 top-6" />
      <Float icon={FileSpreadsheet} title="BOQ.xlsx" sub="Shared with bidders" className="-bottom-1 left-2" />
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl">
        <div className="flex gap-5 border-b border-slate-200 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Overview</span>
          <span className="border-b-2 border-orange-500 pb-2 text-slate-800">Bidders</span>
          <span>Bid form</span>
          <span>Compare</span>
        </div>
        <div className="mt-3 space-y-2.5">
          {rows.map(([name, w, tone, label]) => (
            <div key={name} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-2.5">
              <div className="flex flex-1 items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">{name.slice(-1)}</span>
                <div className="flex-1 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-700">{name}</p>
                  <Bar w={w} />
                </div>
              </div>
              <Pill tone={tone}>{label}</Pill>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/** Publisher side: item-wise quotations against the same BOQ. */
export function QuotationCompareGraphic() {
  return (
    <Frame>
      <Float icon={FileText} title="Quotation received" sub="Item-wise rates" filled className="-top-1 right-0" />
      <Float icon={FileSpreadsheet} title="Export" sub="CSV comparison" className="-bottom-1 left-0" />
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Quotation comparison</p>
        <div className="mt-3 grid grid-cols-[1.3fr_1fr_1fr_1fr] items-center gap-x-3 gap-y-3 text-[10px] text-slate-400">
          <span>BOQ item</span>
          <span>Bidder A</span>
          <span>Bidder B</span>
          <span>Bidder C</span>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="contents">
              <Bar w={`${78 - i * 8}%`} className="bg-slate-300" />
              <Bar w="62%" />
              <Bar w={i === 1 ? "46%" : "66%"} className={i === 1 ? "bg-emerald-300" : ""} />
              <Bar w="72%" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
          <Pill tone="green">Compare side by side</Pill>
          <div className="h-7 w-24 rounded-sm bg-brand-navy" />
        </div>
      </div>
    </Frame>
  );
}

/** Subcontractor side: opportunities moving from shortlist to submission. */
export function OpportunityBoardGraphic() {
  const stages = ["Shortlisted", "Preparing", "Submitted"];
  return (
    <Frame>
      <Float icon={CalendarClock} title="Closing date" sub="Tracked per tender" className="-top-1 left-2" />
      <Float icon={Mail} title="Tender invitation" sub="From a contractor" filled className="-right-1 top-10" />
      <Float icon={FileText} title="Quotation draft" sub="Documents attached" className="-bottom-1 right-2" />
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Opportunities</p>
        <div className="mt-3 flex overflow-hidden rounded-full border border-slate-200 text-[10px] font-medium">
          {stages.map((s, i) => (
            <span key={s} className={`flex-1 px-3 py-1.5 text-center ${i === 1 ? "bg-[#1b4a94] text-white" : "text-slate-500"}`}>
              {s}
            </span>
          ))}
        </div>
        <div className="mt-3 space-y-2.5">
          {[
            ["62%", "Go / No-Go", "blue"],
            ["50%", "Review", "amber"],
            ["70%", "Ready to quote", "green"],
          ].map(([w, label, tone], i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-2.5">
              <div className="flex-1 space-y-1.5">
                <Bar w={w} className="bg-slate-300" />
                <Bar w="40%" />
              </div>
              <Pill tone={tone as Tone}>{label}</Pill>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}
