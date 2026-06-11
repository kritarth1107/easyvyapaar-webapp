"use client";

import { useId, useRef } from "react";
import { formatDateIndian } from "@/lib/dashboard/date-format";

type CompactDateFieldProps = {
  value: string;
  onChange: (isoDate: string) => void;
  label?: string;
  id?: string;
  className?: string;
  fullWidth?: boolean;
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-brand-primary-muted" aria-hidden>
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3 8h14M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function openDatePicker(input: HTMLInputElement | null) {
  if (!input) return;
  input.focus({ preventScroll: true });
  try {
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
  } catch {
    // showPicker blocked or unsupported
  }
}

const dateInputClass =
  "absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

export function CompactDateField({
  value,
  onChange,
  label,
  id,
  className = "",
  fullWidth = false,
}: CompactDateFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? "w-full" : "inline-flex"} ${className}`}>
      {label ? (
        <span
          id={`${fieldId}-label`}
          className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted"
        >
          {label}
        </span>
      ) : null}
      <span
        className={`relative inline-flex h-9 items-center gap-2 rounded-sm border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary shadow-sm ${
          fullWidth ? "w-full" : "w-[10.75rem]"
        }`}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.target === inputRef.current) return;
          e.preventDefault();
          openDatePicker(inputRef.current);
        }}
      >
        <span className="pointer-events-none flex-1 truncate tabular-nums">{formatDateIndian(value)}</span>
        <span className="pointer-events-none">
          <CalendarIcon />
        </span>
        <input
          ref={inputRef}
          id={fieldId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={dateInputClass}
          aria-labelledby={label ? `${fieldId}-label` : undefined}
          aria-label={label ?? "Select date"}
        />
      </span>
    </div>
  );
}
