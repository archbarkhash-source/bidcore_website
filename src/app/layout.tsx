import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/bidcore-api";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Bidcore: Construction Tender, Estimation and Project Software for Contractors",
  description:
    "BidcoreAI helps EPC contractors, builders and subcontractors find tenders, estimate, manage projects and find suppliers and vendors.",
  applicationName: "Bidcore",
  openGraph: { type: "website", siteName: "Bidcore", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: { url: "/images/favicon.png", type: "image/png" },
  },
};

// Who the site belongs to, for search engines (Organization + WebSite). Nothing here is a claim about size, ratings or prices.
const ORGANIZATION = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bidcore",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    email: "info@bidcore.in",
    sameAs: ["https://www.youtube.com/@bidcoreai", "https://www.linkedin.com/company/bidcoreai", "https://x.com/BidcoreAI"],
  },
  { "@context": "https://schema.org", "@type": "WebSite", name: "Bidcore", url: SITE_URL, inLanguage: "en-IN" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <JsonLd data={ORGANIZATION} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
