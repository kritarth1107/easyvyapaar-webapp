/** One payment against an invoice or bill (backend paymentHistory). */
export type PaymentHistoryEntry = {
  amount: number;
  paymentMode: string;
  paidAt: string;
  source: "direct" | "voucher";
  paymentId?: string;
};

export function normalizePaymentHistory(raw: unknown): PaymentHistoryEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: PaymentHistoryEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const amount = typeof row.amount === "number" ? row.amount : Number(row.amount);
    const paidAt = typeof row.paidAt === "string" ? row.paidAt : "";
    if (!Number.isFinite(amount) || !paidAt) continue;
    out.push({
      amount,
      paymentMode: typeof row.paymentMode === "string" && row.paymentMode ? row.paymentMode : "cash",
      paidAt,
      source: row.source === "voucher" ? "voucher" : "direct",
      ...(typeof row.paymentId === "string" && row.paymentId ? { paymentId: row.paymentId } : {}),
    });
  }
  return out;
}
