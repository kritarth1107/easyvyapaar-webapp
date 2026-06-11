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

const TREND_ORANGE = "#F63E16";

function buildSmoothLinePath(coords: { x: number; y: number }[]): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

export function TrendLineChart({
  points,
  valueKey,
  color = TREND_ORANGE,
  gradientId = "trendFill",
  valueFormatter,
}: {
  points: { day: string; units: number; value: number }[];
  valueKey: "units" | "value";
  color?: string;
  gradientId?: string;
  valueFormatter?: (value: number) => string;
}) {
  const values = points.map((p) => p[valueKey]);
  const max = Math.max(...values, 1);
  const w = 320;
  const h = 132;
  const padX = 12;
  const padY = 14;
  const chartBottom = h - padY;
  const chartTop = padY;
  const chartHeight = chartBottom - chartTop;
  const step = (w - padX * 2) / Math.max(points.length - 1, 1);
  const fmt = valueFormatter ?? ((n: number) => String(n));

  const coords = points.map((p, i) => {
    const x = padX + i * step;
    const y = chartBottom - (p[valueKey] / max) * chartHeight;
    return { x, y, ...p };
  });

  const line = buildSmoothLinePath(coords);
  const area = `${line} L ${coords[coords.length - 1]?.x ?? padX} ${chartBottom} L ${coords[0]?.x ?? padX} ${chartBottom} Z`;
  const gridLines = [0.25, 0.5, 0.75].map((ratio) => chartTop + chartHeight * (1 - ratio));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[280px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="55%" stopColor={color} stopOpacity="0.08" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map((y) => (
          <line
            key={y}
            x1={padX}
            y1={y}
            x2={w - padX}
            y2={y}
            stroke="#E2E8F0"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c) => (
          <g key={c.day}>
            <circle cx={c.x} cy={c.y} r="8" fill={color} opacity="0.12" />
            <circle
              cx={c.x}
              cy={c.y}
              r="4"
              fill="#fff"
              stroke={color}
              strokeWidth="2"
            >
              <title>{`${c.day}: ${fmt(c[valueKey])}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between gap-1 text-[11px] font-medium text-brand-primary-muted">
        {points.map((p) => (
          <span key={p.day} className="min-w-0 truncate text-center">{p.day}</span>
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
