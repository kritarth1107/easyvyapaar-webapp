/** Invoice-settings `paymentQr` is a free-form string. Option keys such as
 * `upi-1` are not a VPA. Only a value with `@` is a VPA. */
export function shopVpaFromPaymentQr(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const at = v.indexOf("@");
  if (at <= 0 || at === v.length - 1) return null;
  if (/\s/.test(v)) return null;
  return v;
}

/** Settings field value: hide legacy `upi-1` / `upi-2` option keys. */
export function paymentQrInputValue(raw: string): string {
  return shopVpaFromPaymentQr(raw) ?? (raw.startsWith("upi-") ? "" : raw);
}

/** Hide on paid / cancelled / draft, and when nothing is due. */
export function showUpiCollectQr({
  status,
  balanceAmount,
}: {
  status: string;
  balanceAmount: number;
}): boolean {
  if (status === "paid" || status === "cancelled" || status === "draft") return false;
  return balanceAmount > 0;
}

/** Standard UPI intent. `amount` is remaining due, not the original total. */
export function buildUpiCollectUri({
  vpa,
  amount,
  note,
}: {
  vpa: string;
  amount: number;
  note: string;
}): string {
  const pa = vpa.trim();
  const am = amount.toFixed(2);
  const tn = note.trim();
  let query = `pa=${pa}&am=${am}`;
  if (tn) query += `&tn=${encodeURIComponent(tn)}`;
  query += "&cu=INR";
  return `upi://pay?${query}`;
}
