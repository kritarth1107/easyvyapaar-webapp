import Link from "next/link";
import { LEGAL_ENTITY } from "@/legal/company";
import type { LegalDocument, LegalSection } from "@/legal/types";

function renderSection(section: LegalSection, depth = 0) {
  const HeadingTag = depth === 0 ? "h2" : "h3";
  const headingClass =
    depth === 0
      ? "mt-10 scroll-mt-24 text-xl font-bold text-brand-primary first:mt-0"
      : "mt-6 text-lg font-semibold text-brand-primary";

  return (
    <section key={section.id} id={section.id} className="scroll-mt-24">
      <HeadingTag className={headingClass}>{section.title}</HeadingTag>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="mt-3 text-sm leading-7 text-brand-primary/85">
          {paragraph}
        </p>
      ))}
      {section.bullets?.length ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-brand-primary/85">
          {section.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {section.subsections?.map((subsection) => renderSection(subsection, depth + 1))}
    </section>
  );
}

export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <header className="border-b border-slate-200/90 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange-2">
          {LEGAL_ENTITY.productName} Legal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-primary">{document.title}</h1>
        <p className="mt-3 text-sm leading-7 text-brand-primary-muted">{document.description}</p>
        <dl className="mt-5 grid gap-2 text-sm text-brand-primary-muted sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-brand-primary">Effective date</dt>
            <dd>{document.effectiveDate}</dd>
          </div>
          <div>
            <dt className="font-semibold text-brand-primary">Last updated</dt>
            <dd>{document.lastUpdated}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-brand-primary">Company</dt>
            <dd>
              {LEGAL_ENTITY.legalName} · CIN {LEGAL_ENTITY.cin}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-brand-primary">Contact</dt>
            <dd>
              <a href={`mailto:${LEGAL_ENTITY.contactEmail}`} className="text-brand-orange-2 hover:underline">
                {LEGAL_ENTITY.contactEmail}
              </a>
            </dd>
          </div>
        </dl>
      </header>

      <div className="py-8">{document.sections.map((section) => renderSection(section))}</div>

      <footer className="border-t border-slate-200/90 pt-8 text-sm text-brand-primary-muted">
        <p>
          Questions about this document? Email{" "}
          <a href={`mailto:${LEGAL_ENTITY.contactEmail}`} className="font-semibold text-brand-orange-2 hover:underline">
            {LEGAL_ENTITY.contactEmail}
          </a>
          .
        </p>
        <nav className="mt-4 flex flex-wrap gap-4">
          <Link href="/legal" className="font-semibold text-brand-orange-2 hover:underline">
            All legal documents
          </Link>
          <Link href="/legal/privacy-policy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/legal/terms-of-service" className="hover:underline">
            Terms of Service
          </Link>
          <Link href="/legal/data-deletion-instructions" className="hover:underline">
            Data Deletion
          </Link>
        </nav>
      </footer>
    </article>
  );
}
