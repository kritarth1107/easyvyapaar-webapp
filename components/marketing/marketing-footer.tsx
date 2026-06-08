import Link from "next/link";
import { LEGAL_ENTITY } from "@/legal/company";
import { CONTACT_EMAIL } from "@/lib/marketing/site-content";
import { FOOTER_COLUMNS } from "@/lib/marketing/navigation";

export function MarketingFooter() {
  return (
    <footer className="bg-brand-primary text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-lg font-bold">Mahajaan</p>
            <p className="mt-2 max-w-sm text-sm leading-7 text-white/65">
              GST billing, inventory, POS, and reports for Indian retail shops. Built for counters
              that cannot afford slow software.
            </p>
            <div className="mt-5 space-y-2 text-sm text-white/75">
              <p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>mahajaan.com · mahajaan.in</p>
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-wide text-white/50">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/75 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {LEGAL_ENTITY.legalName}. CIN {LEGAL_ENTITY.cin}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/legal/privacy-policy" className="hover:text-white/70">
              Privacy
            </Link>
            <Link href="/legal/terms-of-service" className="hover:text-white/70">
              Terms
            </Link>
            <Link href="/legal/data-deletion-instructions" className="hover:text-white/70">
              Data deletion
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
