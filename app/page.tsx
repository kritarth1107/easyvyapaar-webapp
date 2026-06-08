import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_WHITE } from "@/lib/brand/assets";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site-metadata";

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-brand-primary">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-orange-1/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-brand-primary-light/40 blur-3xl" />

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex max-w-xl flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <Image
              src={BRAND_LOGO_WHITE}
              alt={SITE_NAME}
              width={160}
              height={64}
              className="h-14 w-auto object-contain"
              priority
            />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange-3">
              {SITE_TAGLINE}
            </p>
          </div>

          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-orange-1" />
              Under construction
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Our landing page is on the way
            </h1>
            <p className="text-base leading-7 text-white/65 sm:text-lg">
              We&apos;re building something great for Indian retailers. A full marketing site will
              live here soon — billing, inventory, GST, and more, all in one place.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-8 text-sm font-semibold text-white shadow-lg shadow-brand-orange-1/25 transition-opacity hover:opacity-95"
          >
            Go to dashboard
          </Link>
        </div>
      </main>

      <footer className="relative border-t border-white/10 px-6 py-6 text-center text-xs text-white/50">
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/legal/privacy-policy" className="hover:text-white/80">
            Privacy Policy
          </Link>
          <Link href="/legal/terms-of-service" className="hover:text-white/80">
            Terms of Service
          </Link>
          <Link href="/legal/data-deletion-instructions" className="hover:text-white/80">
            Data Deletion
          </Link>
        </nav>
        <p className="mt-3">© {new Date().getFullYear()} ZEROKNOW TECHNOLOGIES PRIVATE LIMITED</p>
      </footer>
    </div>
  );
}
