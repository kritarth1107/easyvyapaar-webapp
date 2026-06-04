export function deepMerge(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, patchValue] of Object.entries(patch)) {
    if (patchValue === undefined) continue;

    const baseValue = result[key];
    if (
      typeof patchValue === "object" &&
      patchValue !== null &&
      !Array.isArray(patchValue) &&
      typeof baseValue === "object" &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(
        baseValue as Record<string, unknown>,
        patchValue as Record<string, unknown>
      );
    } else {
      result[key] = patchValue;
    }
  }

  return result;
}
