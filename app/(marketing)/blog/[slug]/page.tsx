import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_ARTICLE_BODY, BLOG_POSTS } from "@/lib/marketing/site-content";
import { getBlogPostKeywords } from "@/lib/seo/marketing-keywords";
import { buildMarketingMetadata } from "@/lib/seo/site-metadata";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return buildMarketingMetadata({
    title: post.title,
    description: `${post.excerpt} — Mahajaan blog for Indian retail shops. Tips on GST, inventory, POS & operations vs Vyapar, myBillBook & Tally workflows.`,
    path: `/blog/${post.slug}`,
    keywords: getBlogPostKeywords(post.slug),
  });
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const paragraphs = BLOG_ARTICLE_BODY[slug] ?? [];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "Mahajaan",
    },
  };

  return (
    <article className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link href="/blog" className="text-sm font-semibold text-brand-orange-2 hover:underline">
          ← Back to blog
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-wide text-brand-orange-2">{post.category}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-sm text-brand-primary-muted">
          {formatDate(post.date)} · {post.readMinutes} min read
        </p>
        <p className="mt-6 text-lg leading-8 text-brand-primary/90">{post.excerpt}</p>
        <div className="prose prose-slate mt-8 max-w-none">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mb-4 text-base leading-8 text-brand-primary/85">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
