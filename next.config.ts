import type { NextConfig } from "next";

// www.bidcore.in is the public front door of Bidcore Tender Connect: tenders first, companies (only those with an active subscription) under Explore.
// The old registry-based directory pages (states, cities, near me ...) are not linked any more; their addresses land on the one companies page.
const toCompanies = [
  "/contractors",
  "/developers",
  "/general-contractors",
  "/architects",
  "/suppliers",
  "/states",
  "/states/:path*",
  "/cities",
  "/company-types",
  "/specializations",
  "/near-me",
  "/companies/:state/:company",
];

const nextConfig: NextConfig = {
  output: "standalone",
  distDir: process.env.NEXT_DIST_DIR || ".next", // lets a verification build run beside a running dev server
  async redirects() {
    return [
      { source: "/bid-board", destination: "/tenders", permanent: true }, // Tender Connect = the public published tenders
      { source: "/products/procurement", destination: "/products/procurement-management", permanent: true },
      ...toCompanies.map((source) => ({ source, destination: "/companies", permanent: false })),
    ];
  },
};

export default nextConfig;
