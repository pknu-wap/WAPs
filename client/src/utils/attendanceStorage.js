const STORAGE_KEY = "waps-admin-attendance-sessions";

const DEFAULT_MEMBERS = [
  { id: "demo-1", name: "잔망루피", role: "ROLE_MEMBER" },
  { id: "demo-2", name: "뽀로로", role: "ROLE_USER" },
  { id: "demo-3", name: "크롱", role: "ROLE_MEMBER" },
];

export const attendanceRoleLabel = (role) =>
  ({
    ROLE_ADMIN: "임원진",
    ROLE_MEMBER: "정회원",
    ROLE_USER: "준회원",
    ROLE_GUEST: "신입",
  })[role] || role || "회원";

const ATTENDANCE_ROLE_ORDER = {
  ROLE_GUEST: 0,
  ROLE_USER: 1,
  ROLE_MEMBER: 2,
  ROLE_ADMIN: 3,
};

export const compareAttendanceRoles = (firstRole, secondRole) =>
  (ATTENDANCE_ROLE_ORDER[firstRole] ?? Number.MAX_SAFE_INTEGER) -
  (ATTENDANCE_ROLE_ORDER[secondRole] ?? Number.MAX_SAFE_INTEGER);

export const createAttendanceSession = (title, eventDate, deadlineTime, members = DEFAULT_MEMBERS) => {
  const currentDate = new Date();
  const now = currentDate.toISOString();
  return {
    id: `attendance-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    eventDate,
    deadlineTime,
    status: "OPEN",
    createdAt: now,
    endedAt: null,
    members: members.map((member) => ({
      userId: member.id,
      name: member.name,
      role: member.role,
      status: "ABSENT",
      note: "",
    })),
  };
};

export const readAttendanceSessions = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    return Array.isArray(sessions) ? sessions : [];
  } catch {
    return [];
  }
};

export const writeAttendanceSessions = (sessions) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return true;
  } catch {
    return false;
  }
};

export const attendanceCounts = (session) => ({
  presentCount: session.members.filter((member) => member.status === "PRESENT").length,
  lateCount: session.members.filter((member) => member.status === "LATE").length,
  absentCount: session.members.filter((member) => member.status === "ABSENT").length,
});
