/**
 * Filename from a Content-Disposition header. Prefers RFC 5987 `filename*=UTF-8''…`
 * (Unicode names such as "बिल-INV-12.pdf"), then quoted / bare `filename=`.
 */
export function parseContentDispositionFilename(header: string | null | undefined): string | null {
  if (!header) return null;
  const star = /filename\*\s*=\s*([^;]+)/i.exec(header);
  if (star) {
    const raw = star[1].trim().replace(/^"(.*)"$/, "$1");
    const match = /^([\w!#$%&+^`{}~-]+)'[^']*'(.*)$/.exec(raw);
    const encoded = match ? match[2] : raw;
    try {
      const decoded = decodeURIComponent(encoded);
      if (decoded.trim()) return sanitizeFilename(decoded);
    } catch {
      // fall through to plain filename=
    }
  }
  const plain = /filename\s*=\s*("((?:\\.|[^"\\])*)"|[^;]+)/i.exec(header);
  if (plain) {
    const value = (plain[2] ?? plain[1]).replace(/\\(.)/g, "$1").trim();
    if (value) return sanitizeFilename(value);
  }
  return null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_").trim();
}

/** Header that every browser reads correctly: ASCII fallback + UTF-8 filename*. */
export function buildContentDisposition(filename: string, type: "inline" | "attachment" = "inline"): string {
  const ascii = filename.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "_") || "document.pdf";
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
