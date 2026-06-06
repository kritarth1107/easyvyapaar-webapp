import {
  createInventoryCategory,
  fetchInventoryCategories,
} from "@/lib/inventory/inventory-api-client";
import {
  getPresetCategoryName,
  isPresetCategoryId,
} from "@/lib/inventory/predefined-categories";

export async function resolveCategoryIdForSave(
  categoryId: string,
  organisationId: string,
  resolvedByName: Map<string, string>,
): Promise<string> {
  if (!isPresetCategoryId(categoryId)) return categoryId;

  const name = getPresetCategoryName(categoryId);
  if (!name) throw new Error("Invalid category selected");

  const cacheKey = name.toLowerCase();
  const cached = resolvedByName.get(cacheKey);
  if (cached) return cached;

  try {
    const created = await createInventoryCategory(organisationId, name);
    resolvedByName.set(cacheKey, created.categoryId);
    return created.categoryId;
  } catch {
    const existing = await fetchInventoryCategories(organisationId);
    const match = existing.find((row) => row.name.toLowerCase() === cacheKey);
    if (match) {
      resolvedByName.set(cacheKey, match.categoryId);
      return match.categoryId;
    }
    throw new Error(`Could not create category "${name}"`);
  }
}
