export function FeatureIcon({ type, className = "h-6 w-6" }: { type: string; className?: string }) {
  const paths: Record<string, string> = {
    receipt: "M6 3h12v18H6V3zm2 4h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z",
    file: "M8 3h6l4 4v14H8V3zm6 1.5V8h3.5L14 4.5zM10 12h6v2h-6v-2zm0 4h6v2h-6v-2z",
    box: "M4 8l8-4 8 4v8l-8 4-8-4V8zm8 10.2 6-3V9.3l-6 3v5.9zm-2-6.7L6 9.3v5.9l6 3v-5.9z",
    users: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H5zm14-2a6 6 0 00-4-5.7 6 6 0 014 3.7z",
    chart: "M4 19h16v2H4v-2zm3-8v6H7v-6h2zm4 3v3h-2v-3h2zm4-6v9h-2V8h2z",
    badge: "M12 2l2.2 4.5 5 .7-3.6 3.5.9 5.2L12 13.8 7.5 16l.9-5.2L4.8 7.2l5-.7L12 2z",
    wallet: "M3 7h18v10H3V7zm2 2v6h14V9H5zm12 2h2v2h-2v-2z",
    truck: "M2 7h13v8H2V7zm13 1h4l2 3v4h-6V8zM6 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm11 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={paths[type] ?? paths.receipt} />
    </svg>
  );
}
