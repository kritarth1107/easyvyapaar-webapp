import type { Metadata } from "next";

export const SITE_NAME = "Mahajaan";
export const SITE_TAGLINE = "Retail ERP for Indian shops";
export const DEFAULT_KEYWORDS = [
  "Mahajaan",
  "retail ERP India",
  "kirana shop software",
  "GST billing software",
  "inventory management",
  "POS billing India",
  "mahajaan retail app",
];

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: `/${string}`;
  keywords?: string[];
  robots?: Metadata["robots"];
  /** When true, merges DEFAULT_KEYWORDS (marketing pages pass full lists). */
  mergeDefaultKeywords?: boolean;
};

/** Builds consistent, share-friendly metadata for auth and marketing pages. */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const url = `${getSiteUrl()}${input.path}`;
  const title = input.title.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`;
  const pageKeywords = input.keywords ?? [];
  const keywords =
    input.mergeDefaultKeywords === false
      ? [...new Set(pageKeywords)]
      : [...new Set([...pageKeywords, ...DEFAULT_KEYWORDS])];

  return {
    title,
    description: input.description,
    keywords,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: getSiteUrl() }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: url,
    },
    robots: input.robots ?? {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url,
      siteName: SITE_NAME,
      title,
      description: input.description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
    },
    category: "business",
  };
}

/** Marketing landing pages — rich SEO with 100+ keywords, no auth defaults mixed in. */
export function buildMarketingMetadata(
  input: Omit<PageMetadataInput, "mergeDefaultKeywords"> & { keywords: string[] },
): Metadata {
  return buildPageMetadata({ ...input, mergeDefaultKeywords: false });
}

export const loginPageMetadata = buildPageMetadata({
  title: "Sign in to your shop",
  description:
    "Sign in to Mahajaan with your mobile number. Access billing, inventory, GST invoices, and daily reports for your Indian retail store.",
  path: "/auth/login",
  keywords: [
    "Mahajaan login",
    "shop owner login",
    "retail ERP sign in",
    "GST billing login India",
  ],
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
});

export const registerPageMetadata = buildPageMetadata({
  title: "Create your free shop account",
  description:
    "Register on Mahajaan in minutes. Verify GST (optional), add your business details, and start managing inventory, billing, and GST-ready invoices for your shop.",
  path: "/auth/register",
  keywords: [
    "Mahajaan sign up",
    "register kirana shop",
    "free retail ERP India",
    "GST shop registration",
    "create shop account",
  ],
});
