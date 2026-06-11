/** Staff can only be listed or marked for attendance on or after their joining date. */
export function isStaffEligibleForAttendanceDate(
  joinDate: string | undefined | null,
  attendanceDate: string,
): boolean {
  const join = joinDate?.trim();
  if (!join) return true;
  return attendanceDate >= join;
}

export function filterStaffEligibleForAttendanceDate<T extends { joinDate?: string }>(
  staff: T[],
  attendanceDate: string,
): T[] {
  return staff.filter((member) => isStaffEligibleForAttendanceDate(member.joinDate, attendanceDate));
}
