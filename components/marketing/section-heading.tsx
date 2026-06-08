export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange-2">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-3 text-base leading-7 text-brand-primary-muted">{description}</p>
      ) : null}
    </div>
  );
}
