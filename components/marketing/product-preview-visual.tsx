type Variant = "dashboard" | "billing";

function StatChip({ label, value, tone }: { label: string; value: string; tone: "green" | "red" | "blue" | "orange" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    blue: "bg-sky-50 text-sky-700 border-sky-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
  };
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      <div className="pointer-events-none absolute -left-6 top-8 h-28 w-28 rounded-full bg-brand-orange-1/20 blur-2xl" />
      <div className="pointer-events-none absolute -right-4 bottom-6 h-32 w-32 rounded-full bg-brand-primary/10 blur-2xl" />

      <div className="relative space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatChip label="To collect" value="₹24,500" tone="green" />
          <StatChip label="To pay" value="₹8,200" tone="red" />
          <StatChip label="Stock value" value="₹3.2L" tone="blue" />
          <StatChip label="Today" value="₹12,840" tone="orange" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_60px_-28px_rgba(3,31,73,0.35)]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-brand-surface/60 px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-primary-muted">Sales invoice</p>
              <p className="text-sm font-bold text-brand-primary">INV-2026-0142</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">
              GST
            </span>
          </div>

          <div className="space-y-3 px-4 py-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-brand-primary-muted">Rahul Traders</span>
              <span className="text-brand-primary-muted">4 Jun 2026</span>
            </div>

            <div className="space-y-2">
              {[
                { name: "Samsung Galaxy A15", qty: "1", amt: "₹14,999" },
                { name: "Screen guard", qty: "2", amt: "₹598" },
                { name: "Back cover", qty: "1", amt: "₹399" },
              ].map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between rounded-lg bg-brand-surface/50 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-brand-primary">{row.name}</span>
                  <span className="tabular-nums text-brand-primary-muted">
                    {row.qty} × {row.amt}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex justify-between text-xs text-brand-primary-muted">
                <span>Taxable</span>
                <span className="tabular-nums">₹13,895</span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-brand-primary-muted">
                <span>CGST + SGST</span>
                <span className="tabular-nums">₹2,501</span>
              </div>
              <div className="mt-2 flex justify-between text-sm font-bold text-brand-primary">
                <span>Total</span>
                <span className="tabular-nums text-brand-orange-2">₹16,396</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -right-2 top-1/2 hidden w-36 -translate-y-1/2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-lg sm:block">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-primary-muted">Low stock</p>
          <p className="mt-1 text-xs font-semibold text-brand-primary">Atta 5kg</p>
          <p className="text-[10px] text-rose-600">Only 3 left</p>
        </div>
      </div>
    </div>
  );
}

function BillingPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_20px_50px_-24px_rgba(3,31,73,0.3)]">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-brand-surface/40 px-3 py-2.5">
          <span className="text-brand-primary-muted">⌕</span>
          <span className="text-sm text-brand-primary-muted">Search item or scan barcode…</span>
        </div>

        <div className="mt-4 space-y-2">
          {[
            { name: "Dhaniya powder 100g", price: "₹45", active: true },
            { name: "Basmati rice 5kg", price: "₹620" },
            { name: "Refined oil 1L", price: "₹165" },
          ].map((item) => (
            <div
              key={item.name}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${
                item.active ? "bg-brand-primary text-white" : "bg-brand-surface/50 text-brand-primary"
              }`}
            >
              <span className="font-medium">{item.name}</span>
              <span className="font-semibold tabular-nums">{item.price}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl brand-gradient-orange-h px-4 py-3 text-white">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/80">Bill total</p>
            <p className="text-xl font-bold tabular-nums">₹830</p>
          </div>
          <span className="rounded-sm bg-white/20 px-4 py-2 text-xs font-bold">Charge →</span>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-4 rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-md">
        <p className="text-[10px] font-bold uppercase text-brand-primary-muted">Payment</p>
        <p className="text-xs font-semibold text-emerald-600">UPI · Cash · Card</p>
      </div>
    </div>
  );
}

export function ProductPreviewVisual({ variant = "dashboard" }: { variant?: Variant }) {
  return (
    <div aria-hidden className="select-none">
      {variant === "billing" ? <BillingPreview /> : <DashboardPreview />}
    </div>
  );
}
