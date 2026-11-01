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
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/supply/list-your-company", destination: "/marketplace/list-your-business" }, // the page file keeps its old folder name
        { source: "/supply", destination: "/marketplace" },
        { source: "/supply/:path*", destination: "/marketplace/:path*" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/bid-board", destination: "/tenders", permanent: true }, // Tender Connect = the public published tenders
      { source: "/products/procurement", destination: "/products/procurement-management", permanent: true },
      { source: "/company/:slug", destination: "/contractor/:slug", permanent: true },      // the old address of a contractor's page
      // The products & services pages used to live under /marketplace; the public address is /supply (the page files stay in src/app/marketplace, see rewrites)
      { source: "/marketplace/list-your-business", destination: "/supply/list-your-company", permanent: true },
      { source: "/supply/list-your-business", destination: "/supply/list-your-company", permanent: true },
      { source: "/marketplace", destination: "/supply", permanent: true },
      { source: "/marketplace/:path*", destination: "/supply/:path*", permanent: true },
      ...toContractors.map((source) => ({ source, destination: "/contractors", permanent: false })),
    ];
  },
};

export default nextConfig;
