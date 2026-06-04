import type { Metadata } from "next";

export const SITE_NAME = "EasyVyapaar";
export const SITE_TAGLINE = "Retail ERP for Indian shops";
export const DEFAULT_KEYWORDS = [
  "EasyVyapaar",
  "retail ERP India",
  "kirana shop software",
  "GST billing software",
  "inventory management",
  "POS billing India",
  "vyapaar management app",
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
};

/** Builds consistent, share-friendly metadata for auth and marketing pages. */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const url = `${getSiteUrl()}${input.path}`;
  const title = input.title.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`;
  const keywords = [...new Set([...(input.keywords ?? []), ...DEFAULT_KEYWORDS])];

  return {
    title,
    description: input.description,
    keywords,
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
      card: "summary",
      title,
      description: input.description,
    },
    category: "business",
  };
}

export const loginPageMetadata = buildPageMetadata({
  title: "Sign in to your shop",
  description:
    "Sign in to EasyVyapaar with your mobile number. Access billing, inventory, GST invoices, and daily reports for your Indian retail store.",
  path: "/auth/login",
  keywords: [
    "EasyVyapaar login",
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
    "Register on EasyVyapaar in minutes. Verify GST (optional), add your business details, and start managing inventory, billing, and GST-ready invoices for your shop.",
  path: "/auth/register",
  keywords: [
    "EasyVyapaar sign up",
    "register kirana shop",
    "free retail ERP India",
    "GST shop registration",
    "create shop account",
  ],
});
