const STORAGE_KEY = "waps.pendingAttendance";

export function savePendingAttendance(search) {
  clearPendingAttendance();
  const params = new URLSearchParams(search);
  const attendanceId = params.get("attendanceId");
  const token = params.get("token");
  if (/^[1-9][0-9]*$/.test(attendanceId) && token?.trim()) {
    sessionStorage.setItem(
      STORAGE_KEY,
      new URLSearchParams({ attendanceId, token }).toString(),
    );
  }
}

export function clearPendingAttendance() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function consumePendingAttendance() {
  const search = sessionStorage.getItem(STORAGE_KEY);
  clearPendingAttendance();
  // Only a fixed local attendance route can be resumed after authentication.
  return search ? `/attendance?${search}` : "/ProjectPage";
}
