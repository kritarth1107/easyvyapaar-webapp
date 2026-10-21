const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

/** Shop-facing date: `16 Oct 2026`. Accepts ISO, ISO datetime, or US `MM/DD/YYYY`. */
export function formatDateEnIn(value: string): string {
  const trimmed = value.trim();
  const isoDay = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoDay) {
    const year = Number(isoDay[1]);
    const month = Number(isoDay[2]);
    const day = Number(isoDay[3]);
    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const month = Number(us[1]);
    const day = Number(us[2]);
    const year = Number(us[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  return trimmed;
}

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
