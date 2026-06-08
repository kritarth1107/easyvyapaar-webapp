import Link from "next/link";
import { LEGAL_ENTITY } from "@/legal/company";
import { LEGAL_DOCUMENTS } from "@/legal/documents";

export function LegalIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="border-b border-slate-200/90 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange-2">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-primary">
          {LEGAL_ENTITY.productName} legal documents
        </h1>
        <p className="mt-3 text-sm leading-7 text-brand-primary-muted">
          Policies and terms for {LEGAL_ENTITY.domains.join(" and ")}, operated by {LEGAL_ENTITY.legalName}{" "}
          (CIN {LEGAL_ENTITY.cin}).
        </p>
      </header>

      <ul className="divide-y divide-slate-200/90 py-4">
        {LEGAL_DOCUMENTS.map((doc) => (
          <li key={doc.slug} className="py-5">
            <Link href={`/legal/${doc.slug}`} className="group block">
              <h2 className="text-lg font-semibold text-brand-primary group-hover:text-brand-orange-2">
                {doc.title}
              </h2>
              <p className="mt-1 text-sm leading-7 text-brand-primary-muted">{doc.description}</p>
              <p className="mt-2 text-xs text-brand-primary-muted">Last updated {doc.lastUpdated}</p>
            </Link>
          </li>
        ))}
      </ul>

      <footer className="border-t border-slate-200/90 pt-8 text-sm text-brand-primary-muted">
        <p>
          Contact:{" "}
          <a href={`mailto:${LEGAL_ENTITY.contactEmail}`} className="font-semibold text-brand-orange-2 hover:underline">
            {LEGAL_ENTITY.contactEmail}
          </a>
        </p>
        <Link href="/" className="mt-4 inline-block font-semibold text-brand-orange-2 hover:underline">
          Back to home
        </Link>
      </footer>
    </div>
  );
}
