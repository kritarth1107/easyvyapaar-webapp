const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

/** Format ISO date (YYYY-MM-DD) as DD-MMM-YYYY e.g. 04-JUN-2026 */
export function formatDateIndian(iso: string): string {
  const trimmed = iso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const [year, month, day] = trimmed.split("-");
  const monthIdx = Number(month) - 1;
  const mon = MONTHS_SHORT[monthIdx] ?? month;
  return `${day}-${mon}-${year}`;
}

/** Format YYYY-MM as JUN 2026 */
export function formatMonthIndian(month: string): string {
  const trimmed = month.trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  const [year, mo] = trimmed.split("-");
  const monthIdx = Number(mo) - 1;
  const mon = MONTHS_SHORT[monthIdx] ?? mo;
  return `${mon} ${year}`;
}

export function parseIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const ddMmmYyyy = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (ddMmmYyyy) {
    const day = ddMmmYyyy[1].padStart(2, "0");
    const mon = ddMmmYyyy[2].toUpperCase();
    const year = ddMmmYyyy[3];
    const monthIdx = MONTHS_SHORT.indexOf(mon as (typeof MONTHS_SHORT)[number]);
    if (monthIdx >= 0) {
      return `${year}-${String(monthIdx + 1).padStart(2, "0")}-${day}`;
    }
  }
  return null;
}
