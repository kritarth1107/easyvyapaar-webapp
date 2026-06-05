"use client";

import type { NamedSlice } from "@/lib/dashboard/stock-summary-analytics";
import { formatInrBrief, formatPct } from "@/lib/dashboard/stock-summary-analytics";

export function DonutChart({
  slices,
  size = 168,
  holeRatio = 0.58,
}: {
  slices: NamedSlice[];
  size?: number;
  holeRatio?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-slate-100 text-xs text-brand-primary-muted"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  let deg = 0;
  const stops = slices.map((slice) => {
    const sweep = (slice.value / total) * 360;
    const start = deg;
    deg += sweep;
    return `${slice.color} ${start}deg ${deg}deg`;
  });

  const hole = Math.round(size * holeRatio);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="h-full w-full rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      />
      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-center shadow-inner"
        style={{ width: hole, height: hole }}
      >
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-brand-primary-muted">
            Total
          </p>
          <p className="text-sm font-bold text-brand-primary">{formatInrBrief(total)}</p>
        </div>
      </div>
    </div>
  );
}

export function ChartLegend({ slices, valueFormatter }: { slices: NamedSlice[]; valueFormatter?: (n: number) => string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const fmt = valueFormatter ?? ((n: number) => String(n));

  return (
    <ul className="min-w-0 flex-1 space-y-2">
      {slices.map((slice) => {
        const pct = total > 0 ? (slice.value / total) * 100 : 0;
        return (
          <li key={slice.id} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate font-medium text-brand-primary">{slice.label}</span>
            <span className="shrink-0 tabular-nums text-brand-primary-muted">
              {fmt(slice.value)} · {formatPct(pct, 0)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function HorizontalBarChart({
  rows,
  maxValue,
  valueLabel,
}: {
  rows: { id: string; label: string; value: number; sublabel?: string; color: string }[];
  maxValue?: number;
  valueLabel?: (n: number) => string;
}) {
  const max = maxValue ?? Math.max(...rows.map((r) => r.value), 1);
  const fmt = valueLabel ?? ((n: number) => String(n));

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const pct = (row.value / max) * 100;
        return (
          <div key={row.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-brand-primary">{row.label}</span>
              <span className="shrink-0 tabular-nums text-brand-primary-muted">{fmt(row.value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-sm bg-slate-100">
              <div
                className="h-full rounded-sm transition-all"
                style={{ width: `${pct}%`, backgroundColor: row.color }}
              />
            </div>
            {row.sublabel && (
              <p className="mt-0.5 text-[11px] text-brand-primary-muted">{row.sublabel}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TrendLineChart({
  points,
  valueKey,
}: {
  points: { day: string; units: number; value: number }[];
  valueKey: "units" | "value";
}) {
  const values = points.map((p) => p[valueKey]);
  const max = Math.max(...values, 1);
  const w = 320;
  const h = 120;
  const pad = 8;
  const step = (w - pad * 2) / Math.max(points.length - 1, 1);

  const coords = points.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - (p[valueKey] / max) * (h - pad * 2);
    return { x, y, ...p };
  });

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1]?.x ?? 0} ${h - pad} L ${pad} ${h - pad} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[280px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F63E16" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F63E16" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#trendFill)" />
        <path d={line} fill="none" stroke="#F63E16" strokeWidth="2" strokeLinecap="round" />
        {coords.map((c) => (
          <circle key={c.day} cx={c.x} cy={c.y} r="3.5" fill="#fff" stroke="#F63E16" strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] font-medium text-brand-primary-muted">
        {points.map((p) => (
          <span key={p.day}>{p.day}</span>
        ))}
      </div>
    </div>
  );
}

export function MiniSparkline({ values, color = "#031F49" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const w = 64;
  const h = 24;
  const step = w / Math.max(values.length - 1, 1);
  const d = values
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * h;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-16" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
