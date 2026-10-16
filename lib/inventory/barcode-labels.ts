import JsBarcode from "jsbarcode";
import { escapeHtml, printHtmlDocument } from "@/lib/print/print-html";

export type BarcodeLabelLayout = "a4-21" | "a4-40" | "roll-50x25" | "roll-38x25";

export type BarcodeLabelEntry = {
  name: string;
  code: string;
  price: string;
  copies: number;
};

export type BarcodeLabelOptions = {
  layout: BarcodeLabelLayout;
  showName: boolean;
  showPrice: boolean;
  priceLabel: string;
  businessName?: string;
};

type LayoutSpec = {
  page: string;
  /** label cell size in mm */
  w: number;
  h: number;
  cols: number;
  gapMm: number;
  pageMarginMm: number;
};

export const BARCODE_LAYOUTS: Record<BarcodeLabelLayout, LayoutSpec> = {
  "a4-21": { page: "A4 portrait", w: 63.5, h: 38.1, cols: 3, gapMm: 2.5, pageMarginMm: 8 },
  "a4-40": { page: "A4 portrait", w: 48.5, h: 25.4, cols: 4, gapMm: 0, pageMarginMm: 8 },
  "roll-50x25": { page: "50mm 25mm", w: 50, h: 25, cols: 1, gapMm: 0, pageMarginMm: 0 },
  "roll-38x25": { page: "38mm 25mm", w: 38, h: 25, cols: 1, gapMm: 0, pageMarginMm: 0 },
};

/** Render a CODE128 barcode as an SVG string. Returns null if the value cannot be encoded. */
export function renderBarcodeSvg(value: string, opts: { height?: number; width?: number } = {}): string | null {
  if (typeof document === "undefined" || !value.trim()) return null;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  try {
    JsBarcode(svg, value.trim(), {
      format: "CODE128",
      displayValue: true,
      fontSize: 12,
      margin: 0,
      height: opts.height ?? 40,
      width: opts.width ?? 1.4,
    });
  } catch {
    return null;
  }
  // Make it scale to the label cell.
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  const w = svg.getAttribute("width");
  const h = svg.getAttribute("height");
  if (w && h) svg.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  return svg.outerHTML;
}

export function buildBarcodeLabelSheetHtml(entries: BarcodeLabelEntry[], options: BarcodeLabelOptions): string {
  const spec = BARCODE_LAYOUTS[options.layout];
  const isRoll = options.layout.startsWith("roll");
  const small = spec.h <= 26;
  const cells: string[] = [];
  for (const entry of entries) {
    const svg = renderBarcodeSvg(entry.code, { height: small ? 28 : 40 }) ?? `<div class="bad">${escapeHtml(entry.code)}</div>`;
    const cell = `<div class="label">
      ${options.showName ? `<div class="name">${escapeHtml(entry.name)}</div>` : ""}
      <div class="bc">${svg}</div>
      ${options.showPrice && entry.price ? `<div class="price">${escapeHtml(options.priceLabel)}: ${escapeHtml(entry.price)}</div>` : ""}
    </div>`;
    for (let i = 0; i < Math.max(0, Math.floor(entry.copies)); i += 1) cells.push(cell);
  }

  return `<!doctype html><html><head><meta charset="utf-8" /><title>Barcode labels</title>
<style>
  @page { size: ${spec.page}; margin: ${spec.pageMarginMm}mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; font-family: Arial, sans-serif; }
  .sheet { ${isRoll ? "display: block;" : `display: grid; grid-template-columns: repeat(${spec.cols}, ${spec.w}mm); gap: ${spec.gapMm}mm;`} }
  .label { width: ${spec.w}mm; height: ${spec.h}mm; padding: ${small ? 1 : 2}mm; overflow: hidden;
           display: flex; flex-direction: column; align-items: center; justify-content: center;
           break-inside: avoid; page-break-inside: avoid; ${isRoll ? "page-break-after: always; break-after: page;" : "outline: 0.2mm dotted #bbb;"} }
  .name { font-size: ${small ? 7 : 9}pt; font-weight: 700; text-align: center; line-height: 1.1; max-height: 2.2em; overflow: hidden; width: 100%; }
  .bc { flex: 1; width: 100%; min-height: 0; display: flex; align-items: center; justify-content: center; }
  .bc svg { width: 100%; height: 100%; }
  .price { font-size: ${small ? 7.5 : 9.5}pt; font-weight: 700; }
  .bad { font-family: monospace; font-size: 8pt; }
  @media print { .label { outline: none; } }
</style></head><body><div class="sheet">${cells.join("")}</div></body></html>`;
}

export function printBarcodeLabels(entries: BarcodeLabelEntry[], options: BarcodeLabelOptions): void {
  printHtmlDocument(buildBarcodeLabelSheetHtml(entries, options), "Barcode labels");
}
