import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-metadata";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/auth/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
