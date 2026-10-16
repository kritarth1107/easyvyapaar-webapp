/**
 * e-Invoice Ack date for display: locale date + time in IST.
 * Accepts ISO strings and the NIC "YYYY-MM-DD HH:mm:ss" form (treated as IST); unparseable input is returned as-is.
 */
export function formatAckDate(value: string | null | undefined, locale: string): string {
  if (!value) return "";
  const raw = value.trim();
  const nic = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/.exec(raw);
  const date = new Date(nic ? `${nic[1]}T${nic[2]}+05:30` : raw);
  if (Number.isNaN(date.getTime())) return raw;
  try {
    return new Intl.DateTimeFormat(`${locale}-IN`, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(date);
  } catch {
    return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  }
}
