import Link from "next/link";
import { Gavel, ShieldCheck, Building2, HardHat, FolderKanban, Lock } from "lucide-react";

const CARDS = [
  {
    icon: Gavel,
    title: "Invitation to Bid (ITB)",
    description: "Post a project, invite qualified companies, and collect bids in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Contractor Qualification",
    description:
      "Licenses, certifications, financials and safety records verified before anyone bids.",
  },
  {
    icon: Building2,
    title: "For Developers & GCs",
    description: "Source and qualify subcontractors and vendors from the verified network.",
  },
  {
    icon: HardHat,
    title: "For Subcontractors",
    description: "Get discovered, receive bid invitations, and build your qualification once.",
  },
  {
    icon: FolderKanban,
    title: "Project Directory",
    description: "Browse active and upcoming projects across India's construction market.",
  },
  {
    icon: Lock,
    title: "Bid Leveling",
    description: "Compare incoming bids side by side on the same scope, apples to apples.",
  },
];

export default function BidBoardPage() {
  return (
    <div>
      <section className="bg-[#F6F7F9]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            <Lock className="h-3 w-3" />
            Coming Soon
          </span>
          <h1 className="mt-4 text-3xl font-bold text-brand-navy sm:text-4xl">
            The Bid Network for Indian Construction
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Once the company network reaches critical mass, Bid Board connects GCs, developers
            and subcontractors through invitation-to-bid workflows, built on the same verified
            profiles you find today.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
            >
              Sign Up
            </Link>
            <Link
              href="/companies"
              className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-brand-navy transition hover:border-slate-400"
            >
              Explore Companies Now
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-slate-200 bg-white p-6 transition hover:border-brand-accent/30 hover:shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-accent/10 text-brand-accent">
                <card.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-brand-navy">{card.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{card.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
