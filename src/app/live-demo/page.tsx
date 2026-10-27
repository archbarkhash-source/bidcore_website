import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { SITE_URL } from "@/lib/bidcore-api";

export const metadata: Metadata = {
  title: "Watch a Live Demo of BidcoreAI (India) | Bidcore",
  description: "Watch the BidcoreAI India interface in action: training and demo videos for tendering, estimating, planning and project management.",
  alternates: { canonical: "/live-demo" },
  openGraph: { title: "Watch a Live Demo of BidcoreAI (India)", url: `${SITE_URL}/live-demo`, type: "website", siteName: "Bidcore", locale: "en_IN" },
};

// The BidcoreAI (India) Training Videos playlist on the BidcoreAI YouTube channel. Embedded without cookies until the video is played.
const PLAYLIST_ID = "PLNOjSgwlR1aM";
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;

export default function LiveDemoPage() {
  return (
    <div className="bg-white">
      <section className="bg-brand-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400 sm:text-sm">Live demo</p>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">See the Indian BidcoreAI interface in action</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            Watch the BidcoreAI India training and demo videos: publishing and pricing tenders, estimating with Indian cost data, planning and running the project.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/request-demo" className="w-full justify-center sm:w-auto inline-flex items-center gap-3 rounded-sm bg-orange-500 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-orange-400">
              Book a live demo <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={PLAYLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full justify-center sm:w-auto inline-flex items-center gap-2 rounded-sm border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-white/10"
            >
              Open on YouTube <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/videoseries?list=${PLAYLIST_ID}`}
            title="BidcoreAI (India) Training Videos"
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <p className="mt-4 text-sm text-slate-600">
          The playlist plays one video after another; use the list inside the player to pick a video. Prefer a walk-through with a Bidcore team member?{" "}
          <Link href="/request-demo" className="font-medium text-brand-accent hover:underline">
            Request a live demo
          </Link>{" "}
          and choose a date and time in IST.
        </p>
      </section>
    </div>
  );
}
