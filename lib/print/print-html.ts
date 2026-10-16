/**
 * Print a self-contained HTML document via a hidden iframe so the dashboard
 * shell (sidebar, topbar) never leaks into the printout. Used for thermal
 * receipts and barcode label sheets whose @page size differs from A4.
 */
export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function printHtmlDocument(html: string, title = "Print"): void {
  if (typeof window === "undefined") return;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = title;
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => window.setTimeout(() => iframe.remove(), 500);
  const run = () => {
    const win = iframe.contentWindow;
    if (!win) return cleanup();
    win.focus();
    win.addEventListener("afterprint", cleanup, { once: true });
    win.print();
    // Fallback for browsers that don't fire afterprint on iframes.
    window.setTimeout(cleanup, 60_000);
  };
  // Give the iframe a tick to lay out (SVG barcodes, fonts).
  window.setTimeout(run, 150);
}

export type PrintWindowHandle = {
  /** Replace the window content with the final document and open the print dialog. */
  print: (html: string, title?: string) => void;
  /** Close the pre-opened window (e.g. when the save failed). */
  close: () => void;
};

/**
 * Open the print window synchronously inside the user gesture (click / keypress) so
 * popup blockers allow it, then fill it once async work (save, QR render) resolves.
 * Falls back to the hidden-iframe printer if the browser still blocks the popup.
 */
export function openPrintWindow(title = "Print"): PrintWindowHandle {
  const win = typeof window === "undefined" ? null : window.open("", "_blank", "width=420,height=640");
  if (win) {
    win.document.title = title;
    win.document.body.innerHTML =
      '<p style="font-family:sans-serif;padding:16px;color:#555">Preparing print…</p>';
  }
  let done = false;
  return {
    print: (html, docTitle) => {
      if (done) return;
      done = true;
      if (!win || win.closed) {
        printHtmlDocument(html, docTitle ?? title);
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      const run = () => {
        win.focus();
        win.addEventListener("afterprint", () => win.close(), { once: true });
        win.print();
      };
      window.setTimeout(run, 150);
    },
    close: () => {
      if (done) return;
      done = true;
      if (win && !win.closed) win.close();
    },
  };
}
