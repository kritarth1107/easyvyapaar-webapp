import Link from "next/link";
import { SHOP_TYPES } from "@/lib/marketing/site-content";

function SectorIcon({ type }: { type: string }) {
  const paths: Record<string, string> = {
    store: "M4 4h16v16H4V4zm2 3v4h12V7H6zm0 6v5h5v-5H6zm7 0v5h5v-5h-5z",
    mobile: "M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zm1 2v12h6V5H9zm3 14a1 1 0 100-2 1 1 0 000 2z",
    health: "M12 2a6 6 0 00-6 6c0 4.5 6 12 6 12s6-7.5 6-12a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z",
    fabric: "M4 6h16v2l-2 10H6L4 8V6zm4 3v2h2V9H8zm6 0v2h2V9h-2z",
    tools: "M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.1 2.1-2.8-2.8 2.1-2.1z",
    truck: "M2 7h13v8H2V7zm13 1h4l2 3v4h-6V8zM6 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm11 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  };
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={paths[type] ?? paths.store} />
    </svg>
  );
}

export function ShopTypesStrip() {
  return (
    <section className="border-y border-slate-200/80 bg-white py-4 sm:py-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2 sm:px-6">
        <p className="shrink-0 text-sm font-bold text-brand-primary sm:text-[15px]">
          Built for shops like yours
        </p>

        <div className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
          {SHOP_TYPES.map((shop) => (
            <Link
              key={shop.id}
              href={shop.href}
              className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200/90 bg-brand-surface/60 px-2.5 py-1 text-xs font-semibold text-brand-primary transition hover:border-brand-orange-1/40 hover:bg-brand-surface-warm hover:text-brand-orange-2 sm:px-3 sm:py-1.5"
            >
              <SectorIcon type={shop.icon} />
              {shop.label}
            </Link>
          ))}
        </div>

        <Link
          href="/use-cases"
          className="shrink-0 text-xs font-semibold text-brand-orange-2 hover:underline sm:ml-auto sm:text-sm"
        >
          All use cases →
        </Link>
      </div>
    </section>
  );
}
