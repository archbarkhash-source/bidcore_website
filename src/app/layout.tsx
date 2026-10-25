import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/bidcore-api";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "BidcoreAI Tender Connect: Find Construction Tenders in India",
  description:
    "Find public construction tenders, prepare quotations and submit them with BidcoreAI Tender Connect.",
  icons: {
    icon: { url: "/images/favicon.png", type: "image/png" },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
