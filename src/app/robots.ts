import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/bidcore-api";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/tenders", "/contractors", "/supply"], disallow: ["/api/", "/admin/", "/supply/dashboard", "/supply/list-your-company", "/supply/search", "/my-company", "/settings", "/saved", "/connections", "/login", "/sign-in", "/send-tender-invite", "/invite"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
