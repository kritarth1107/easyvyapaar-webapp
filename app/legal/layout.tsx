import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO } from "@/lib/brand/assets";
import { LEGAL_ENTITY } from "@/legal/company";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-white text-brand-primary">
      <header className="border-b border-slate-200/90 bg-brand-surface/30">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="inline-flex shrink-0 items-center hover:opacity-80">
            <Image
              src={BRAND_LOGO}
              alt={LEGAL_ENTITY.productName}
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-brand-primary-muted">
            <Link href="/legal" className="hover:text-brand-primary">
              Legal
            </Link>
            <Link href="/legal/privacy-policy" className="hover:text-brand-primary">
              Privacy
            </Link>
            <Link href="/legal/terms-of-service" className="hover:text-brand-primary">
              Terms
            </Link>
            <Link href="/legal/data-deletion-instructions" className="hover:text-brand-primary">
              Data deletion
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
