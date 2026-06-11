import type { AttendanceStatus } from "@/lib/types/staff-api";

export const ATTENDANCE_STATUS_ORDER: AttendanceStatus[] = [
  "present",
  "absent",
  "half_day",
  "leave",
];

export type AttendanceStatusUi = {
  row: string;
  accent: string;
  pill: string;
  chipActive: string;
  chipIdle: string;
};

export function getAttendanceStatusUi(status: AttendanceStatus): AttendanceStatusUi {
  switch (status) {
    case "present":
      return {
        row: "bg-emerald-50/60",
        accent: "border-l-[3px] border-l-emerald-500",
        pill: "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/15",
        chipActive: "border-emerald-600 bg-emerald-600 text-white shadow-sm",
        chipIdle: "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50",
      };
    case "absent":
      return {
        row: "bg-red-50/60",
        accent: "border-l-[3px] border-l-red-500",
        pill: "bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/15",
        chipActive: "border-red-600 bg-red-600 text-white shadow-sm",
        chipIdle: "border-red-200 bg-white text-red-800 hover:bg-red-50",
      };
    case "half_day":
      return {
        row: "bg-amber-50/60",
        accent: "border-l-[3px] border-l-amber-500",
        pill: "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-600/15",
        chipActive: "border-amber-500 bg-amber-500 text-white shadow-sm",
        chipIdle: "border-amber-200 bg-white text-amber-900 hover:bg-amber-50",
      };
    case "leave":
      return {
        row: "bg-sky-50/60",
        accent: "border-l-[3px] border-l-sky-500",
        pill: "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-600/15",
        chipActive: "border-sky-600 bg-sky-600 text-white shadow-sm",
        chipIdle: "border-sky-200 bg-white text-sky-800 hover:bg-sky-50",
      };
    default:
      return {
        row: "bg-slate-50/50",
        accent: "border-l-[3px] border-l-slate-300",
        pill: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-400/15",
        chipActive: "border-slate-600 bg-slate-600 text-white",
        chipIdle: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      };
  }
}
