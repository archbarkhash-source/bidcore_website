import type { NextConfig } from "next";

// www.bidcore.in is the public front door of Bidcore Tender Connect: tenders first, the contractor directory (/contractors, /contractor/<name>) under Explore.
// The old addresses (/companies, /company/<name>) and the old registry-based directory pages (states, cities, near me ...) land on the contractor directory.
const toContractors = [
  "/companies",
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
      { source: "/company/:slug", destination: "/contractor/:slug", permanent: true },      // the old address of a contractor's page
      ...toContractors.map((source) => ({ source, destination: "/contractors", permanent: false })),
    ];
  },
};

export default nextConfig;
