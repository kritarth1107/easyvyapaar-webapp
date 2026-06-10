import type { LegalDocument, LegalSection } from "@/legal/types";

function renderSection(section: LegalSection, depth = 0) {
  const HeadingTag = depth === 0 ? "h2" : "h3";
  const headingClass =
    depth === 0
      ? "mt-8 scroll-mt-6 text-lg font-bold text-brand-primary first:mt-0 sm:mt-10 sm:text-xl"
      : "mt-5 text-base font-semibold text-brand-primary sm:mt-6 sm:text-lg";

  return (
    <section key={section.id} id={section.id} className="scroll-mt-6">
      <HeadingTag className={headingClass}>{section.title}</HeadingTag>
      {section.paragraphs?.map((paragraph) => (
        <p
          key={paragraph.slice(0, 48)}
          className="mt-3 text-sm leading-7 text-brand-primary/85"
        >
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

export function LegalDocumentContent({ document }: { document: LegalDocument }) {
  return <div>{document.sections.map((section) => renderSection(section))}</div>;
}
