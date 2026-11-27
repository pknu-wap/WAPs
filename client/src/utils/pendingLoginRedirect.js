const STORAGE_KEY = "waps.pendingLoginRedirect";

export function savePendingAttendance(search) {
  clearPendingLoginRedirect();
  const params = new URLSearchParams(search);
  const attendanceId = params.get("attendanceId");
  const token = params.get("token");
  if (/^[1-9][0-9]*$/.test(attendanceId) && token?.trim()) {
    sessionStorage.setItem(
      STORAGE_KEY,
      `/attendance?${new URLSearchParams({ attendanceId, token })}`,
    );
  }
}

export function clearPendingLoginRedirect() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function saveVoteRedirect() {
  sessionStorage.setItem(STORAGE_KEY, "/vote");
}

export function consumePendingLoginRedirect() {
  const destination = sessionStorage.getItem(STORAGE_KEY);
  clearPendingLoginRedirect();
  // Authentication may resume only these fixed local routes.
  return destination === "/vote" || destination?.startsWith("/attendance?")
    ? destination
    : "/ProjectPage";
}
