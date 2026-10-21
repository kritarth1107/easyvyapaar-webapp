/** Shop is GST-registered only when a GSTIN is on the organisation. */
export function isShopGstRegistered(gstNumber?: string | null): boolean {
  return Boolean(gstNumber?.trim());
}
