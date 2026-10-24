"use client";

import { useEffect, useState } from "react";

const groupClass =
  "flex h-11 overflow-hidden rounded-sm border border-slate-200/90 bg-white focus-within:border-brand-orange-1/50 focus-within:ring-2 focus-within:ring-brand-orange-1/15";
const btnClass =
  "flex h-11 w-11 shrink-0 items-center justify-center text-lg font-medium text-brand-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
const inputClass =
  "h-full min-w-0 flex-1 border-0 bg-transparent px-1 text-center text-base font-semibold tabular-nums text-brand-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function formatDraftNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return value === Math.round(value) ? String(value) : String(value);
}

export function PurchaseBillNumberStepper({
  label,
  value,
  prefix,
  suffix,
  step = 1,
  min = 0,
  max,
  minusDisabled,
  plusDisabled,
  onChange,
  onStepToZero,
  minusAria,
  plusAria,
  valueAria,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
  onChange: (next: number) => void;
  onStepToZero?: () => void;
  minusAria: string;
  plusAria: string;
  valueAria: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    setDraft(null);
  }, [value]);

  const clampToMax = (next: number) =>
    max != null && Number.isFinite(max) ? Math.min(max, next) : next;

  const commit = (raw: string) => {
    const parsed = Number(raw.trim());
    if (!Number.isFinite(parsed)) {
      setDraft(null);
      return;
    }
    if (parsed <= 0 && onStepToZero) {
      onStepToZero();
      return;
    }
    onChange(clampToMax(Math.max(min, parsed)));
    setDraft(null);
  };

  const stepBy = (delta: number) => {
    const next = value + delta;
    if (next <= 0 && onStepToZero) {
      onStepToZero();
      return;
    }
    if (next < min) return;
    if (max != null && next > max) return;
    onChange(next);
  };

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <div className={groupClass}>
        <button
          type="button"
          disabled={minusDisabled || (onStepToZero ? false : value <= min)}
          onClick={() => stepBy(-step)}
          className={`${btnClass} border-r border-slate-200/90`}
          aria-label={minusAria}
        >
          −
        </button>
        {prefix ? (
          <span className="flex items-center pl-1.5 text-sm font-semibold text-brand-primary-muted">{prefix}</span>
        ) : null}
        <input
          type="text"
          inputMode="decimal"
          aria-label={valueAria}
          value={draft ?? formatDraftNumber(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className={inputClass}
        />
        {suffix ? (
          <span className="flex items-center pr-1.5 text-xs font-medium text-brand-primary-muted">{suffix}</span>
        ) : null}
        <button
          type="button"
          disabled={plusDisabled || (max != null && value >= max)}
          onClick={() => stepBy(step)}
          className={`${btnClass} border-l border-slate-200/90`}
          aria-label={plusAria}
        >
          +
        </button>
      </div>
    </div>
  );
}
