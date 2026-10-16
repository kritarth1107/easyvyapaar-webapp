import { parseContentDispositionFilename } from "@/lib/print/content-disposition";

/** Fetch a BFF PDF URL and save it under the server's (Unicode-safe) filename. */
export async function downloadPdf(url: string, fallbackFilename: string): Promise<void> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    let message = "Failed to download PDF";
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body?.error === "string" && body.error.trim()) message = body.error;
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const filename = parseContentDispositionFilename(res.headers.get("Content-Disposition")) ?? fallbackFilename;
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

export function orgPdfUrl(path: string, organisationId: string, extra: Record<string, string | undefined> = {}): string {
  const search = new URLSearchParams({ organisationId });
  for (const [key, value] of Object.entries(extra)) if (value) search.set(key, value);
  return `${path}?${search.toString()}`;
}
