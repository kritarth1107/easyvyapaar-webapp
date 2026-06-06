import hsnData from "@/lib/json/hsn.json";

export type HsnCatalogEntry = {
  code: string;
  description: string;
  type: string;
  chapter: string;
  heading: string;
  subheading: string;
};

const CATALOG = hsnData as HsnCatalogEntry[];

export function searchHsnCatalog(query: string, limit = 60): HsnCatalogEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const q = trimmed.toLowerCase();
  const codeQuery = trimmed.replace(/\s/g, "");
  const results: HsnCatalogEntry[] = [];

  for (const entry of CATALOG) {
    const codeMatch =
      entry.code.startsWith(codeQuery) ||
      entry.code.includes(codeQuery) ||
      entry.heading.startsWith(codeQuery) ||
      entry.subheading.startsWith(codeQuery);
    const descMatch = entry.description.toLowerCase().includes(q);

    if (codeMatch || descMatch) {
      results.push(entry);
      if (results.length >= limit) break;
    }
  }

  return results;
}

export function getHsnCatalogSize(): number {
  return CATALOG.length;
}
