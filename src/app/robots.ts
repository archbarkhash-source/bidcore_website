import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/bidcore-api";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/tenders", "/contractors", "/marketplace"], disallow: ["/api/", "/admin/", "/marketplace/dashboard", "/marketplace/list-your-business", "/marketplace/search", "/my-company", "/settings", "/saved", "/connections", "/login", "/sign-in", "/send-tender-invite", "/invite"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
