const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function normalizeGstin(input: string): string {
  return input.trim().toUpperCase().replace(/\s/g, "");
}

export function isValidGstin(input: string): boolean {
  return GSTIN_REGEX.test(normalizeGstin(input));
}
