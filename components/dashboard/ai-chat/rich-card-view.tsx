import type { AiRichCard } from "@/lib/types/ai-chat-api";

function isNegativeValue(value: string): boolean {
  return value.includes("-") || value.toLowerCase().includes("loss");
}

function SummaryRows({
  rows,
}: {
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const negative = isNegativeValue(row.value);
        return (
          <div key={`${row.label}-${row.value}`} className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-brand-primary-muted">{row.label}</span>
            <span
              className={`text-[13px] font-semibold tabular-nums ${
                negative ? "text-rose-600" : "text-brand-primary"
              }`}
            >
              {row.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AiRichCardView({ card }: { card: AiRichCard }) {
  if (card.kind === "summary") {
    const isProfit = card.title?.toLowerCase().includes("profit");
    const netNegative = isNegativeValue(card.total);
    const hasSections = card.sections && card.sections.length > 0;

    return (
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary-muted">
                {card.title ?? "Snapshot"}
              </p>
              <p
                className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${
                  netNegative ? "text-rose-600" : isProfit ? "text-emerald-700" : "text-brand-primary"
                }`}
              >
                {card.total}
              </p>
              <p className="mt-0.5 text-[11px] text-brand-primary-muted">{card.bills}</p>
            </div>
            <p
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                netNegative
                  ? "bg-rose-50 text-rose-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {card.trend}
            </p>
          </div>
        </div>

        <div className="px-4 py-3">
          {hasSections ? (
            <div className="space-y-4">
              {card.sections!.map((section, index) => (
                <div key={section.heading ?? `section-${index}`}>
                  {section.heading ? (
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted/80">
                      {section.heading}
                    </p>
                  ) : null}
                  <SummaryRows rows={section.rows} />
                  {index < card.sections!.length - 1 ? (
                    <div className="mt-4 border-t border-slate-100" />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <SummaryRows rows={card.rows} />
          )}
        </div>
      </div>
    );
  }

  if (card.kind === "stock") {
    return (
      <div
        className={`w-full max-w-full rounded-xl border px-4 py-3 ${
          card.status === "low"
            ? "border-amber-200/80 bg-amber-50/90"
            : "border-emerald-200/80 bg-emerald-50/90"
        }`}
      >
        <div className="flex justify-between gap-3 text-sm">
          <span className="font-semibold text-brand-primary">{card.name}</span>
          <span className="font-bold tabular-nums text-emerald-700">{card.qty}</span>
        </div>
        <p className="mt-1 text-xs text-brand-primary-muted">{card.hint}</p>
      </div>
    );
  }

  if (card.kind === "invoice") {
    const action = card.actions[0] ?? "View";
    return (
      <div className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex justify-between border-b border-slate-100 px-4 py-2.5 text-sm">
          <span className="font-semibold text-brand-primary">{card.id}</span>
          <span className="font-bold tabular-nums text-brand-orange-2">{card.total}</span>
        </div>
        <p className="px-4 py-2 text-xs text-brand-primary-muted">{card.party}</p>
        {card.href ? (
          <div className="border-t border-slate-100 bg-slate-50/50 p-2">
            <a
              href={card.href}
              className="block rounded-lg bg-brand-primary py-2 text-center text-[11px] font-semibold text-white hover:brightness-110"
            >
              {action}
            </a>
          </div>
        ) : card.actions.length > 0 ? (
          <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-2">
            {card.actions.map((actionLabel) => (
              <span
                key={actionLabel}
                className="flex-1 rounded-lg bg-white py-1.5 text-center text-[11px] font-semibold text-brand-primary ring-1 ring-slate-200/80"
              >
                {actionLabel}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (card.kind === "ledger") {
    return (
      <div className="w-full max-w-full rounded-xl border border-rose-200/80 bg-gradient-to-br from-rose-50 to-white px-4 py-3">
        <p className="text-sm font-semibold text-brand-primary">{card.party}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-rose-600">
          {card.amount}
        </p>
        <p className="mt-1 text-xs text-rose-700/75">{card.overdue}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary-muted">
        {card.title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {card.items.map((item) => (
          <li key={item} className="text-sm text-brand-primary">· {item}</li>
        ))}
      </ul>
      <p className="mt-3 rounded-lg brand-gradient-orange py-2 text-center text-xs font-semibold text-white">
        {card.action}
      </p>
    </div>
  );
}
