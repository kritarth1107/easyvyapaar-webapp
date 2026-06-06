import type { InvoicePrintPageSize } from "@/lib/sales/invoice-settings-config";

const PRINT_ROOT_ID = "invoice-print-clone-root";
const PRINT_ACTIVE_CLASS = "invoice-print-active";
const PRINT_STYLE_ID = "invoice-print-page-styles";
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A5_WIDTH_MM = 148;
const PRINT_MARGIN_MM = 5;
const A4_PRINTABLE_WIDTH = A4_WIDTH_MM - PRINT_MARGIN_MM * 2;
const A4_PRINTABLE_HEIGHT = A4_HEIGHT_MM - PRINT_MARGIN_MM * 2;
/** A5 landscape printable area after @page margins (210×148mm page, 5mm margins). */
const A5_LANDSCAPE_PRINTABLE_WIDTH = A4_WIDTH_MM - PRINT_MARGIN_MM * 2;
const A5_LANDSCAPE_PRINTABLE_HEIGHT = A5_WIDTH_MM - PRINT_MARGIN_MM * 2;
/** Uniform scale so the 210×148mm design fits inside the 200×138mm printable area. */
const A5_PRINT_FIT_SCALE = Math.min(
  A5_LANDSCAPE_PRINTABLE_WIDTH / A4_WIDTH_MM,
  A5_LANDSCAPE_PRINTABLE_HEIGHT / A5_WIDTH_MM,
);

export type PrintInvoiceOptions = {
  documentTitle?: string;
  pageSize?: InvoicePrintPageSize;
};

function ensurePrintStyles() {
  let style = document.getElementById(PRINT_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = PRINT_STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    @media print {
      @page invoice-a4-page {
        size: A4 portrait;
        margin: ${PRINT_MARGIN_MM}mm;
      }

      @page invoice-a5-page {
        size: A5 landscape;
        margin: ${PRINT_MARGIN_MM}mm;
      }

      html.invoice-print-active.invoice-print-size-a4 {
        page: invoice-a4-page;
      }

      html.invoice-print-active.invoice-print-size-a5 {
        page: invoice-a5-page;
      }

      html.invoice-print-active #invoice-print-clone-root,
      html.invoice-print-active #invoice-print-clone-root > div {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }

      html.invoice-print-active.invoice-print-size-a5 #invoice-print-clone-root,
      html.invoice-print-active.invoice-print-size-a5 #invoice-print-clone-root > div {
        width: ${A5_LANDSCAPE_PRINTABLE_WIDTH}mm !important;
        height: ${A5_LANDSCAPE_PRINTABLE_HEIGHT}mm !important;
        max-height: ${A5_LANDSCAPE_PRINTABLE_HEIGHT}mm !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid-page !important;
        page-break-after: avoid !important;
      }

      html.invoice-print-active.invoice-print-size-a5 #invoice-print-clone-root > div {
        display: flex !important;
        justify-content: center !important;
        align-items: flex-start !important;
      }

      html.invoice-print-active [data-invoice-document] {
        display: flex !important;
        flex-direction: column !important;
        box-sizing: border-box !important;
        margin: 0 auto !important;
        padding: 0 !important;
        background: #fff !important;
        overflow: visible !important;
      }

      html.invoice-print-active.invoice-print-size-a4 [data-invoice-document] {
        width: ${A4_PRINTABLE_WIDTH}mm !important;
        height: ${A4_PRINTABLE_HEIGHT}mm !important;
        min-height: ${A4_PRINTABLE_HEIGHT}mm !important;
        max-height: ${A4_PRINTABLE_HEIGHT}mm !important;
      }

      html.invoice-print-active.invoice-print-size-a5 [data-invoice-document] {
        width: ${A4_WIDTH_MM}mm !important;
        height: ${A5_WIDTH_MM}mm !important;
        min-height: 0 !important;
        max-height: ${A5_WIDTH_MM}mm !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid-page !important;
        zoom: ${A5_PRINT_FIT_SCALE} !important;
      }

      html.invoice-print-active .invoice-doc-border {
        display: flex !important;
        flex-direction: column !important;
        flex: 1 1 auto !important;
        height: 100% !important;
        min-height: 0 !important;
        border: 1px solid #000 !important;
        box-sizing: border-box !important;
        overflow: visible !important;
      }

      html.invoice-print-active.invoice-print-size-a5 .invoice-doc-border {
        max-height: 100% !important;
      }

      html.invoice-print-active.invoice-print-size-a5 .invoice-doc-border > :not(.invoice-items-grow) {
        flex-shrink: 0 !important;
      }

      html.invoice-print-active .invoice-items-grow {
        display: flex !important;
        flex-direction: column !important;
        flex: 1 1 0 !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }

      html.invoice-print-active .invoice-items-grow > table:not(.invoice-items-spacer) {
        flex-shrink: 0 !important;
      }

      html.invoice-print-active.invoice-print-size-a5 .invoice-items-grow {
        min-height: 0 !important;
      }

      html.invoice-print-active .invoice-items-spacer {
        flex: 1 1 auto !important;
        min-height: 48px !important;
        height: 100% !important;
      }

      html.invoice-print-active.invoice-print-size-a5 .invoice-items-spacer {
        flex: 1 1 0 !important;
        min-height: 0 !important;
        height: auto !important;
      }

      html.invoice-print-active .invoice-items-spacer td {
        height: 100% !important;
        min-height: 48px !important;
        vertical-align: top !important;
      }

      html.invoice-print-active.invoice-print-size-a5 .invoice-items-spacer td {
        min-height: 0 !important;
      }

      html.invoice-print-active .invoice-doc-footer {
        margin-top: auto !important;
      }

      html.invoice-print-active [data-invoice-document] table {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
      }

      html.invoice-print-active [data-invoice-document] th,
      html.invoice-print-active [data-invoice-document] td {
        border-color: #000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
}

function getPrintRoot(): HTMLElement {
  let root = document.getElementById(PRINT_ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = PRINT_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

const PRESERVE_LAYOUT_SELECTOR =
  "[data-invoice-document], .invoice-doc-border, .invoice-items-grow, .invoice-items-spacer, .invoice-doc-footer";

function relaxPrintLayout(node: HTMLElement, invoiceDoc: HTMLElement | null) {
  if (node.matches(PRESERVE_LAYOUT_SELECTOR)) {
    node.style.boxShadow = "none";
    return;
  }

  const insideInvoice = invoiceDoc !== null && invoiceDoc !== node && invoiceDoc.contains(node);
  node.style.overflow = "visible";
  if (!insideInvoice) {
    node.style.maxHeight = "none";
  }
  node.style.boxShadow = "none";
}

function tunePrintClone(shell: HTMLElement, pageSize: InvoicePrintPageSize) {
  if (pageSize !== "a5") return;

  const doc = shell.querySelector<HTMLElement>("[data-invoice-document]");
  if (!doc) return;

  doc.style.width = "";
  doc.style.height = "";
  doc.style.minHeight = "";

  shell.querySelectorAll<HTMLElement>(".invoice-items-grow").forEach((el) => {
    el.style.minHeight = "0";
  });
  shell.querySelectorAll<HTMLElement>(".invoice-items-spacer").forEach((el) => {
    el.style.minHeight = "0";
  });
  shell.querySelectorAll<HTMLElement>(".invoice-doc-footer").forEach((el) => {
    el.style.minHeight = "48px";
  });
}

function prepareClone(source: HTMLElement, pageSize: InvoicePrintPageSize): HTMLElement {
  const invoiceDoc = source.querySelector<HTMLElement>("[data-invoice-document]");

  const shell = document.createElement("div");
  shell.style.display = "block";
  shell.style.width = "100%";
  shell.style.margin = "0";
  shell.style.padding = "0";
  shell.style.background = "#fff";
  shell.style.boxShadow = "none";
  shell.style.border = "none";

  const content = invoiceDoc
    ? (invoiceDoc.cloneNode(true) as HTMLElement)
    : (source.cloneNode(true) as HTMLElement);
  shell.appendChild(content);

  const clonedDoc = shell.querySelector<HTMLElement>("[data-invoice-document]");
  relaxPrintLayout(shell, clonedDoc);
  shell.querySelectorAll<HTMLElement>("*").forEach((node) => relaxPrintLayout(node, clonedDoc));
  tunePrintClone(shell, pageSize);

  return shell;
}

function resolvePageSize(source: HTMLElement, options?: PrintInvoiceOptions): InvoicePrintPageSize {
  if (options?.pageSize) return options.pageSize;
  const fromDoc = source.querySelector<HTMLElement>("[data-invoice-document]")?.dataset.invoicePageSize;
  if (fromDoc === "a4" || fromDoc === "a5") return fromDoc;
  return "a4";
}

function cleanupPrint(previousTitle: string, pageSize: InvoicePrintPageSize) {
  document.body.classList.remove(PRINT_ACTIVE_CLASS);
  document.documentElement.classList.remove(PRINT_ACTIVE_CLASS, `invoice-print-size-${pageSize}`);
  document.getElementById(PRINT_ROOT_ID)?.replaceChildren();
  document.title = previousTitle;
}

function resolvePrintSource(element: HTMLElement | null): HTMLElement | null {
  if (element) return element;
  const fallback = document.querySelector<HTMLElement>("[data-invoice-print-source]");
  return fallback;
}

function normalizeOptions(options?: PrintInvoiceOptions | string): PrintInvoiceOptions {
  if (typeof options === "string") {
    return { documentTitle: options };
  }
  return options ?? {};
}

export function printInvoiceElement(
  element: HTMLElement | null,
  options?: PrintInvoiceOptions | string,
) {
  const opts = normalizeOptions(options);
  const source = resolvePrintSource(element);
  if (!source) return;

  ensurePrintStyles();

  const pageSize = resolvePageSize(source, opts);
  const previousTitle = document.title;
  const title = opts.documentTitle?.trim();
  if (title) {
    document.title = title;
  }

  const root = getPrintRoot();
  root.replaceChildren(prepareClone(source, pageSize));
  document.body.classList.add(PRINT_ACTIVE_CLASS);
  document.documentElement.classList.add(PRINT_ACTIVE_CLASS, `invoice-print-size-${pageSize}`);

  let cleaned = false;
  const finish = () => {
    if (cleaned) return;
    cleaned = true;
    cleanupPrint(previousTitle, pageSize);
  };

  window.addEventListener("afterprint", finish, { once: true });
  window.setTimeout(finish, 60_000);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.print();
    });
  });
}

export function triggerInvoiceSavePdf(
  element: HTMLElement | null,
  options?: PrintInvoiceOptions | string,
) {
  printInvoiceElement(element, options);
}
