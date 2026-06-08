import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/marketing/section-heading";
import { BLOG_POSTS } from "@/lib/marketing/site-content";
import { BLOG_KEYWORDS } from "@/lib/seo/marketing-keywords";
import { buildMarketingMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Blog — GST, inventory, POS & payroll guides for shops",
  description:
    "Practical retail guides for Indian shop owners: GST billing, kirana inventory, busy-counter POS, staff payroll, and comparisons with Vyapar, myBillBook, Tally & Marg ERP workflows.",
  path: "/blog",
  keywords: BLOG_KEYWORDS,
});

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPage() {
  return (
    <>
      <section className="bg-brand-surface py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            align="left"
            eyebrow="Blog"
            title="Guides for shop owners, not jargon"
            description="Short reads on billing, stock, and running a tighter retail operation."
          />
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-orange-2">
                <span>{post.category}</span>
                <span className="text-brand-primary-muted">·</span>
                <span className="text-brand-primary-muted">{post.readMinutes} min read</span>
              </div>
              <h2 className="mt-3 text-xl font-bold text-brand-primary">
                <Link href={`/blog/${post.slug}`} className="hover:text-brand-orange-2">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 flex-1 text-sm leading-7 text-brand-primary-muted">{post.excerpt}</p>
              <p className="mt-4 text-xs text-brand-primary-muted">{formatDate(post.date)}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
