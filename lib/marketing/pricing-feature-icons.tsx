import type { ReactNode } from "react";

const iconClass = "h-5 w-5 shrink-0";

export function FeatureCategoryIcon({ category }: { category: string }) {
  const key = category.toLowerCase();

  if (key.includes("sales") || key.includes("billing")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M9 7h6m-6 4h6m-2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("inventory") || key.includes("stock")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (key.includes("parties") || key.includes("purchase")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm12 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("report") || key.includes("gst")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 3v18h18M7 15l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (key.includes("team") || key.includes("branch")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (key.includes("ai")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1zM19 13l.75 2.25L22 14l-2.25-.75L19 11l-.75 2.25L16 14l2.25.75L19 13z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (key.includes("whatsapp")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.867L.06 23.495l5.753-1.51A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82a9.82 9.82 0 01-5.08-1.42l-.36-.214-3.405.893.91-3.27-.235-.374a9.82 9.82 0 11-1.72 3.005z" />
      </svg>
    );
  }
  if (key.includes("enterprise") || key.includes("partner")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 2l3 7h7l-5.5 4 2 7L12 17l-5.5 4 2-7L2 9h7l3-7z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (key.includes("support")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M18 10a6 6 0 10-12 0v4l-2 2v2h16v-2l-2-2v-4zM9 22h6" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("payment")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    );
  }
  if (key.includes("finance")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 3" strokeLinecap="round" />
    </svg>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  "sales & billing": "bg-orange-100 text-orange-600",
  inventory: "bg-sky-100 text-sky-600",
  "parties & purchases": "bg-violet-100 text-violet-600",
  "reports & gst": "bg-indigo-100 text-indigo-600",
  "team & branches": "bg-amber-100 text-amber-700",
  "mahajaan ai": "bg-rose-100 text-rose-600",
  whatsapp: "bg-emerald-100 text-emerald-600",
  "enterprise & partner": "bg-purple-100 text-purple-600",
  support: "bg-slate-100 text-slate-600",
  payments: "bg-teal-100 text-teal-600",
  finance: "bg-cyan-100 text-cyan-700",
};

export function featureIconWrap(category: string, children: ReactNode) {
  const color =
    CATEGORY_COLORS[category.toLowerCase()] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
      {children}
    </span>
  );
}

export const PLAN_CARD_STYLES: Record<
  string,
  {
    crown: string;
    headerGradient: string;
    border: string;
    shadow: string;
    ring: string;
    cta: string;
    checkBg: string;
    checkText: string;
    priceAccent: string;
    glow: string;
  }
> = {
  STARTER: {
    crown: "text-slate-400",
    headerGradient: "from-slate-100 via-slate-50/80 to-white",
    border: "border-slate-200/90",
    shadow: "shadow-lg shadow-slate-900/6",
    ring: "",
    cta: "bg-brand-primary hover:opacity-95",
    checkBg: "bg-slate-100",
    checkText: "text-slate-600",
    priceAccent: "text-brand-primary",
    glow: "bg-slate-400/20",
  },
  PRO: {
    crown: "text-blue-500",
    headerGradient: "from-blue-100/90 via-blue-50/60 to-white",
    border: "border-blue-200/90",
    shadow: "shadow-2xl shadow-blue-500/18",
    ring: "ring-2 ring-blue-400/40",
    cta: "brand-gradient-orange-h hover:opacity-95",
    checkBg: "bg-blue-100",
    checkText: "text-blue-600",
    priceAccent: "text-blue-700",
    glow: "bg-blue-400/25",
  },
  BUSINESS: {
    crown: "text-emerald-600",
    headerGradient: "from-emerald-100/90 via-emerald-50/50 to-white",
    border: "border-emerald-200/90",
    shadow: "shadow-xl shadow-emerald-900/10",
    ring: "",
    cta: "bg-emerald-700 hover:bg-emerald-800",
    checkBg: "bg-emerald-100",
    checkText: "text-emerald-700",
    priceAccent: "text-emerald-800",
    glow: "bg-emerald-400/20",
  },
};

export const PLAN_COLUMN_META = [
  {
    key: "STARTER" as const,
    label: "Starter",
    crown: "text-slate-500",
    headerBg: "bg-slate-50",
    priceColor: "text-slate-700",
  },
  {
    key: "PRO" as const,
    label: "Pro",
    crown: "text-blue-500",
    headerBg: "bg-blue-50/80",
    priceColor: "text-blue-600",
    popular: true,
  },
  {
    key: "BUSINESS" as const,
    label: "Business",
    crown: "text-emerald-600",
    headerBg: "bg-emerald-50/80",
    priceColor: "text-emerald-700",
  },
  {
    key: "ENTERPRISE" as const,
    label: "Enterprise",
    crown: "text-violet-600",
    headerBg: "bg-violet-50/80",
    priceColor: "text-violet-700",
  },
];

function CrownIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-7 w-7 ${className}`} fill="currentColor" aria-hidden>
      <path d="M5 16L3 7l4.5 2L12 4l4.5 5L21 7l-2 9H5zm2.2 2h9.6l.6 2H6.4l.8-2z" />
    </svg>
  );
}

export function PlanCrownIcon({ className }: { className: string }) {
  return <CrownIcon className={className} />;
}

export function PlanColumnHeader({
  label,
  crownClass,
  popular,
  priceLabel,
}: {
  label: string;
  crownClass: string;
  popular?: boolean;
  priceLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      {popular ? (
        <span className="rounded-full bg-brand-orange-2 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Most popular
        </span>
      ) : (
        <span className="h-[18px]" />
      )}
      <CrownIcon className={`mx-auto h-6 w-6 ${crownClass}`} />
      <span className="text-sm font-bold text-brand-primary">{label}</span>
      <span className="text-[11px] font-medium text-brand-primary-muted">{priceLabel}</span>
    </div>
  );
}
