import type { LiveInvoicePreviewModel } from "@/lib/sales/invoice-preview-document-types";
import type { InvoiceSummaryRowKey } from "@/lib/sales/invoice-preview-document-types";
import QRCode from "qrcode";
import { escapeHtml, openPrintWindow, printHtmlDocument, type PrintWindowHandle } from "@/lib/print/print-html";

export type ThermalRollWidth = 58 | 80;

export type ThermalReceiptLabels = {
  ackNo: string;
  taxInvoice: string;
  invoiceNo: string;
  date: string;
  billTo: string;
  item: string;
  qty: string;
  rate: string;
  amount: string;
  gstSummary: string;
  hsn: string;
  taxable: string;
  cgst: string;
  sgst: string;
  totalTax: string;
  total: string;
  received: string;
  balance: string;
  paymentMode: string;
  qrPlaceholder: string;
  thankYou: string;
};

/** e-Invoice details printed on the receipt; QR box is rendered only when irn is present. */
export type ThermalIrnInfo = {
  irn: string;
  ackNo?: string;
  ackDate?: string;
  /** PNG data URL of the signed QR (see renderSignedQrDataUrl). */
  qrDataUrl?: string;
};

/** Rows the receipt prints itself (grand total / received / balance) — dropped from summaryRows to avoid duplicates. */
/** Rows the receipt renders itself (by key, so translated labels still dedupe). */
const RECEIPT_OWNED_SUMMARY_KEYS = new Set<InvoiceSummaryRowKey>(["totalAmount", "receivedAmount", "balanceAmount"]);

export async function renderSignedQrDataUrl(signedQr: string | undefined | null): Promise<string | undefined> {
  if (!signedQr?.trim()) return undefined;
  try {
    return await QRCode.toDataURL(signedQr, { errorCorrectionLevel: "M", margin: 0, width: 320 });
  } catch {
    return undefined;
  }
}

/** Printable width after the printer's built-in margins (≈48mm on 58, ≈72mm on 80 rolls). */
const PRINTABLE_MM: Record<ThermalRollWidth, number> = { 58: 48, 80: 72 };

export function buildThermalReceiptHtml(
  model: LiveInvoicePreviewModel,
  width: ThermalRollWidth,
  labels: ThermalReceiptLabels,
  irnInfo?: ThermalIrnInfo | null,
): string {
  const e = escapeHtml;
  const contentMm = PRINTABLE_MM[width];
  const fontPx = width === 58 ? 10 : 11.5;
  const narrow = width === 58;

  const lineRows = model.lines
    .map(
      (line) => `
      <tr><td colspan="${narrow ? 3 : 4}" class="name">${e(line.name)}${
        line.serialLabel ? `<div class="muted">${e(line.serialLabel)}</div>` : ""
      }</td></tr>
      <tr class="nums">
        <td>${e(line.qtyLabel)}</td>
        ${narrow ? "" : `<td class="r">${e(line.rate)}</td>`}
        <td class="r muted">${e(line.tax)}</td>
        <td class="r b">${e(line.amount)}</td>
      </tr>`,
    )
    .join("");

  const gstRows = model.gstRows.length
    ? `<div class="sep"></div>
      <div class="c b small">${e(labels.gstSummary)}</div>
      <table class="gst">
        <thead><tr><th>${e(labels.hsn)}</th><th class="r">${e(labels.taxable)}</th><th class="r">${e(
          labels.cgst,
        )}</th><th class="r">${e(labels.sgst)}</th></tr></thead>
        <tbody>${model.gstRows
          .map(
            (row) =>
              `<tr><td>${e(row.hsn)}</td><td class="r">${e(row.taxable)}</td><td class="r">${e(
                row.cgst,
              )}<div class="muted">${e(row.cgstRate)}</div></td><td class="r">${e(row.sgst)}<div class="muted">${e(
                row.sgstRate,
              )}</div></td></tr>`,
          )
          .join("")}</tbody>
      </table>
      <div class="row"><span>${e(labels.totalTax)}</span><span>${e(model.totalTax)}</span></div>`
    : "";

  const summary = model.summaryRows
    .filter((row) => !(row.key && RECEIPT_OWNED_SUMMARY_KEYS.has(row.key)))
    .map(
      (row) =>
        `<div class="row${row.bold ? " b" : ""}"><span>${e(row.label)}</span><span>${e(row.value)}</span></div>`,
    )
    .join("");

  // e-Invoice block only when an IRN exists; QR image when the signed QR could be rendered.
  const irnBlock = irnInfo?.irn
    ? `<div class="sep"></div>
  <div class="qr" data-irn-qr-slot>${
    irnInfo.qrDataUrl ? `<img src="${e(irnInfo.qrDataUrl)}" alt="e-Invoice QR" />` : e(labels.qrPlaceholder)
  }</div>
  <div class="irn">IRN: ${e(irnInfo.irn)}</div>
  ${irnInfo.ackNo ? `<div class="irn">${e(labels.ackNo)}: ${e(irnInfo.ackNo)}${irnInfo.ackDate ? ` · ${e(irnInfo.ackDate)}` : ""}</div>` : ""}`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8" /><title>${e(model.displayNumber)}</title>
<style>
  @page { size: ${width}mm 297mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { width: ${width}mm; font-family: ui-monospace, "Courier New", monospace; font-size: ${fontPx}px; line-height: 1.3; }
  .wrap { width: ${contentMm}mm; margin: 0 auto; padding: 2mm 0 4mm; }
  .c { text-align: center; } .r { text-align: right; } .b { font-weight: 700; }
  .small { font-size: 0.9em; } .muted { color: #333; font-size: 0.85em; }
  .title { font-size: 1.35em; font-weight: 700; }
  .sep { border-top: 1px dashed #000; margin: 1.5mm 0; }
  .row { display: flex; justify-content: space-between; gap: 2mm; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.3mm 0; vertical-align: top; }
  thead th { border-bottom: 1px dashed #000; font-weight: 700; text-align: left; }
  td.name { padding-top: 0.8mm; font-weight: 600; word-break: break-word; }
  table.gst { font-size: 0.85em; }
  .grand { font-size: 1.25em; font-weight: 700; }
  .qr { width: ${narrow ? 30 : 36}mm; height: ${narrow ? 30 : 36}mm; margin: 2mm auto 1mm; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 0.8em; }
  .qr img { width: 100%; height: 100%; image-rendering: pixelated; }
  .irn { font-size: 0.75em; word-break: break-all; text-align: center; }
  @media screen { body { margin: 8px auto; box-shadow: 0 0 0 1px #ddd; } }
</style></head><body><div class="wrap">
  <div class="c title">${e(model.businessName)}</div>
  ${model.businessAddress ? `<div class="c small">${e(model.businessAddress)}</div>` : ""}
  ${model.businessPhone ? `<div class="c small">${e(model.businessPhone)}</div>` : ""}
  ${model.businessTaxLine ? `<div class="c small">${e(model.businessTaxLine)}</div>` : ""}
  <div class="sep"></div>
  <div class="c b">${e(model.documentTitle || labels.taxInvoice)}</div>
  <div class="row"><span>${e(labels.invoiceNo)}</span><span class="b">${e(model.displayNumber)}</span></div>
  <div class="row"><span>${e(labels.date)}</span><span>${e(model.invoiceDate)}</span></div>
  ${model.partyName ? `<div class="row"><span>${e(labels.billTo)}</span><span>${e(model.partyName)}</span></div>` : ""}
  ${model.partyTaxLine ? `<div class="small r">${e(model.partyTaxLine)}</div>` : ""}
  <div class="sep"></div>
  <table>
    <thead><tr><th>${e(labels.qty)}</th>${narrow ? "" : `<th class="r">${e(labels.rate)}</th>`}<th class="r">GST</th><th class="r">${e(
      labels.amount,
    )}</th></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>
  <div class="sep"></div>
  ${summary}
  <div class="row grand"><span>${e(labels.total)}</span><span>${e(model.totalAmount)}</span></div>
  ${gstRows}
  <div class="sep"></div>
  ${model.paymentMode ? `<div class="row"><span>${e(labels.paymentMode)}</span><span>${e(model.paymentMode)}</span></div>` : ""}
  <div class="row"><span>${e(labels.received)}</span><span>${e(model.amountReceived)}</span></div>
  <div class="row"><span>${e(labels.balance)}</span><span>${e(model.balanceAmount)}</span></div>
  ${model.amountInWords ? `<div class="small" style="margin-top:1mm">${e(model.amountInWords)}</div>` : ""}
  ${irnBlock}
  <div class="c b">${e(labels.thankYou)}</div>
</div></body></html>`;
}

export function printThermalReceipt(
  model: LiveInvoicePreviewModel,
  width: ThermalRollWidth,
  labels: ThermalReceiptLabels,
  irnInfo?: ThermalIrnInfo | null,
  printWindow?: PrintWindowHandle,
): void {
  const html = buildThermalReceiptHtml(model, width, labels, irnInfo);
  if (printWindow) printWindow.print(html, model.displayNumber);
  else printHtmlDocument(html, model.displayNumber);
}

export { openPrintWindow };
