import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/marketing/site-content";
import { getSiteUrl } from "@/lib/seo/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const staticPages = [
    "",
    "/features",
    "/use-cases",
    "/pricing",
    "/contact",
    "/blog",
    "/faq",
    "/legal",
    "/legal/privacy-policy",
    "/legal/terms-of-service",
    "/legal/data-deletion-instructions",
  ];

  return [
    ...staticPages.map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.8,
    })),
    ...BLOG_POSTS.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
