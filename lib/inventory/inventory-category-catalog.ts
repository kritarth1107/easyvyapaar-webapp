import type { CategoryOption } from "@/components/dashboard/inventory/category-select";
import { INDUSTRY_TYPES, type IndustryType } from "@/lib/constants/industry-types";
import catalogData from "@/lib/inventory/data/inventory-categories.json";

/** Synthetic id prefix for built-in categories (resolved to API category on item save). */
export const PREDEFINED_CATEGORY_PREFIX = "preset:" as const;

export type InventoryCategoryCatalogEntry = {
  id: string;
  name: string;
  industryType: IndustryType;
};

const CATALOG = catalogData as InventoryCategoryCatalogEntry[];

const CATALOG_BY_PRESET_ID = new Map(
  CATALOG.map((entry) => [`${PREDEFINED_CATEGORY_PREFIX}${entry.id}`, entry]),
);

const CATALOG_BY_INDUSTRY = CATALOG.reduce<Map<IndustryType, InventoryCategoryCatalogEntry[]>>(
  (map, entry) => {
    const list = map.get(entry.industryType) ?? [];
    list.push(entry);
    map.set(entry.industryType, list);
    return map;
  },
  new Map(),
);

export function normalizeIndustryType(value?: string | null): IndustryType | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().toUpperCase();
  if ((INDUSTRY_TYPES as readonly string[]).includes(normalized)) {
    return normalized as IndustryType;
  }
  return null;
}

export function getCatalogEntryCount(): number {
  return CATALOG.length;
}

export function getCatalogCategoriesForIndustry(
  industryType?: string | null,
): CategoryOption[] {
  const industry = normalizeIndustryType(industryType) ?? "OTHER";
  const entries = CATALOG_BY_INDUSTRY.get(industry) ?? CATALOG_BY_INDUSTRY.get("OTHER") ?? [];
  return entries.map((entry) => ({
    categoryId: `${PREDEFINED_CATEGORY_PREFIX}${entry.id}`,
    name: entry.name,
  }));
}

export function isPresetCategoryId(categoryId: string): boolean {
  return categoryId.startsWith(PREDEFINED_CATEGORY_PREFIX);
}

export function getPresetCategoryName(categoryId: string): string | null {
  return CATALOG_BY_PRESET_ID.get(categoryId)?.name ?? null;
}

/** @deprecated Use getCatalogCategoriesForIndustry instead. */
export function getPredefinedCategoryOptions(): CategoryOption[] {
  return getCatalogCategoriesForIndustry("OTHER");
}

/** API/custom categories override presets when names match. */
export function mergeCategoryOptions(
  predefined: CategoryOption[],
  extra: CategoryOption[],
): CategoryOption[] {
  const byName = new Map<string, CategoryOption>();
  for (const option of predefined) {
    byName.set(option.name.toLowerCase(), option);
  }
  for (const option of extra) {
    byName.set(option.name.toLowerCase(), option);
  }
  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}
