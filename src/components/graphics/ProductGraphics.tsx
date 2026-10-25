import { CalendarClock, ClipboardList, FileSearch, FileText, HardHat, PackageCheck, ShieldCheck, Truck, Wallet } from "lucide-react";
import { Bar, Float, Frame, Pill, type Tone } from "@/components/graphics/TenderConnectGraphics";

// Hero illustrations for the other BidcoreAI software products, drawn in the same style as the Tender Connect board: the structure of the screens (tabs, rows, bars, stages),
// not screenshots, with neutral labels only - no real company names, prices or statistics.

function Panel({ tabs, active, children }: { tabs: string[]; active: number; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl">
      <div className="flex gap-5 border-b border-slate-200 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {tabs.map((t, i) => (
          <span key={t} className={i === active ? "border-b-2 border-orange-500 pb-2 text-slate-800" : ""}>
            {t}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}

/** Tender Management: a tender checked against requirements, with findings that point back to a page. */
export function TenderManagementGraphic() {
  const rows: [string, string, Tone, string][] = [
    ["Eligibility", "70%", "green", "Meets"],
    ["Experience", "58%", "amber", "Review"],
    ["Financials", "66%", "green", "Meets"],
    ["Time and risk", "46%", "blue", "Check"],
  ];
  return (
    <Frame>
      <Float icon={FileSearch} title="Page reference" sub="Source page shown" className="-top-1 left-0" />
      <Float icon={ShieldCheck} title="Go / No-Go" sub="Decision recorded" filled className="-right-1 top-6" />
      <Float icon={FileText} title="Bid pack" sub="Checklist ready" className="-bottom-1 left-2" />
      <Panel tabs={["Documents", "Eligibility", "Takeoff", "Estimate"]} active={1}>
        <div className="mt-3 space-y-2.5">
          {rows.map(([name, w, tone, label]) => (
            <div key={name} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-2.5">
              <div className="flex-1 space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-700">{name}</p>
                <Bar w={w} />
              </div>
              <Pill tone={tone}>{label}</Pill>
            </div>
          ))}
        </div>
      </Panel>
    </Frame>
  );
}

/** Project Management: schedule bars with a budget line. */
export function ProjectGraphic() {
  const bars: [string, string, string, string][] = [
    ["Mobilisation", "0%", "30%", "bg-emerald-300"],
    ["Earthwork", "18%", "42%", "bg-[#1b4a94]"],
    ["Structures", "38%", "46%", "bg-[#1b4a94]"],
    ["Finishing", "62%", "30%", "bg-slate-300"],
  ];
  return (
    <Frame>
      <Float icon={Wallet} title="Budget" sub="Cost control" className="-top-1 left-0" />
      <Float icon={CalendarClock} title="Schedule updated" sub="Gantt" filled className="-right-1 top-6" />
      <Float icon={ClipboardList} title="RA bill" sub="Monthly MIS" className="-bottom-1 left-2" />
      <Panel tabs={["Overview", "Schedule", "Budget", "Reports"]} active={1}>
        <div className="mt-3 space-y-3">
          {bars.map(([name, left, w, color]) => (
            <div key={name} className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
              <span className="text-[11px] font-semibold text-slate-700">{name}</span>
              <div className="relative h-3 rounded-full bg-slate-100">
                <div className={`absolute top-0 h-3 rounded-full ${color}`} style={{ left, width: w }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
          <Pill tone="green">On budget</Pill>
          <Bar w="40%" />
        </div>
      </Panel>
    </Frame>
  );
}

/** Procurement Management: a purchase order log with delivery status. */
export function ProcurementGraphic() {
  const rows: [string, string, Tone, string][] = [
    ["PO 001", "72%", "green", "Delivered"],
    ["PO 002", "58%", "blue", "In transit"],
    ["PO 003", "66%", "amber", "Awaiting"],
    ["PO 004", "46%", "slate", "Draft"],
  ];
  return (
    <Frame>
      <Float icon={PackageCheck} title="Material received" sub="Against the PO" className="-top-1 left-0" />
      <Float icon={Truck} title="Delivery update" sub="Vendor" filled className="-right-1 top-6" />
      <Float icon={FileText} title="Change order" sub="Approved" className="-bottom-1 left-2" />
      <Panel tabs={["Log", "Vendors", "Orders", "Changes"]} active={2}>
        <div className="mt-3 space-y-2.5">
          {rows.map(([name, w, tone, label]) => (
            <div key={name} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-2.5">
              <div className="flex flex-1 items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">{name.slice(-1)}</span>
                <div className="flex-1 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-700">{name}</p>
                  <Bar w={w} />
                </div>
              </div>
              <Pill tone={tone}>{label}</Pill>
            </div>
          ))}
        </div>
      </Panel>
    </Frame>
  );
}

/** Site Operations: work packages, crews and the daily progress report. */
export function SiteGraphic() {
  const stages = ["Planned", "In progress", "Done"];
  return (
    <Frame>
      <Float icon={HardHat} title="Crew assigned" sub="Work package" className="-top-1 left-2" />
      <Float icon={ClipboardList} title="Daily progress report" sub="Submitted" filled className="-right-1 bottom-16" />
      <Float icon={Truck} title="Equipment" sub="On site" className="-bottom-1 right-2" />
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Work packages</p>
        <div className="mt-3 flex overflow-hidden rounded-full border border-slate-200 text-[10px] font-medium">
          {stages.map((s, i) => (
            <span key={s} className={`flex-1 px-3 py-1.5 text-center ${i === 1 ? "bg-[#1b4a94] text-white" : "text-slate-500"}`}>
              {s}
            </span>
          ))}
        </div>
        <div className="mt-3 space-y-2.5">
          {(
            [
              ["62%", "Crew A", "blue"],
              ["50%", "Crew B", "amber"],
              ["70%", "Crew C", "green"],
            ] as [string, string, Tone][]
          ).map(([w, label, tone], i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-2.5">
              <div className="flex-1 space-y-1.5">
                <Bar w={w} className="bg-slate-300" />
                <Bar w="40%" />
              </div>
              <Pill tone={tone}>{label}</Pill>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/** The whole suite: the five products as one workflow, for the top of the products page. */
export function SuiteGraphic() {
  const rows: [typeof FileText, string, string, Tone, string][] = [
    [FileText, "Tender Connect", "72%", "green", "Publish"],
    [FileSearch, "Tender Management", "58%", "blue", "Estimate"],
    [CalendarClock, "Project Management", "66%", "green", "Plan"],
    [PackageCheck, "Procurement", "46%", "amber", "Buy"],
    [HardHat, "Site Operations", "54%", "blue", "Build"],
  ];
  return (
    <Frame>
      <Float icon={ShieldCheck} title="Go / No-Go" sub="Before you bid" className="-top-1 left-0" />
      <Float icon={ClipboardList} title="Daily progress report" sub="From the site" filled className="-right-1 top-6" />
      <Float icon={Wallet} title="Budget" sub="Cost control" className="-bottom-1 left-2" />
      <Panel tabs={["Tender", "Plan", "Procure", "Site"]} active={0}>
        <div className="mt-3 space-y-2.5">
          {rows.map(([Icon, name, w, tone, label]) => (
            <div key={name} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-2.5">
              <div className="flex flex-1 items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-navy text-amber-400">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-700">{name}</p>
                  <Bar w={w} />
                </div>
              </div>
              <Pill tone={tone}>{label}</Pill>
            </div>
          ))}
        </div>
      </Panel>
    </Frame>
  );
}

/** A small banner picture for a product card: the product's icon beside a mini screen. */
export function CardArt({ product }: { product: string }) {
  const Icon = { "tender-connect": FileText, "tender-management": FileSearch, "project-management": CalendarClock, procurement: PackageCheck, "site-management": HardHat }[product] ?? FileText;
  const widths = { "tender-connect": ["72%", "55%", "64%"], "tender-management": ["68%", "46%", "60%"], "project-management": ["40%", "62%", "50%"], procurement: ["70%", "52%", "44%"], "site-management": ["58%", "66%", "48%"] }[product] ?? ["60%", "50%", "40%"];
  return (
    <div aria-hidden className="relative flex h-28 items-center gap-4 overflow-hidden rounded-t-lg bg-brand-navy px-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_40%,rgba(251,191,36,0.14),transparent_60%)]" />
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-amber-400">
        <Icon className="h-7 w-7" />
      </span>
      <div className="relative flex-1 space-y-2 rounded-md border border-slate-200 bg-white p-2.5 shadow-xl">
        {widths.map((w, i) => (
          <Bar key={i} w={w} className={i === 1 ? "bg-[#1b4a94]/70" : ""} />
        ))}
      </div>
    </div>
  );
}
