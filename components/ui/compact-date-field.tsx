"use client";

import { formatDateIndian } from "@/lib/dashboard/date-format";

type CompactDateFieldProps = {
  value: string;
  onChange: (isoDate: string) => void;
  label?: string;
  className?: string;
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-brand-primary-muted" aria-hidden>
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3 8h14M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function CompactDateField({ value, onChange, label, className = "" }: CompactDateFieldProps) {
  return (
    <label className={`inline-flex flex-col gap-1 ${className}`}>
      {label ? (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
          {label}
        </span>
      ) : null}
      <span className="relative inline-flex h-9 w-[10.75rem] items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary shadow-sm">
        <span className="pointer-events-none flex-1 truncate tabular-nums">{formatDateIndian(value)}</span>
        <CalendarIcon />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={label ?? "Select date"}
        />
      </span>
    </label>
  );
}
