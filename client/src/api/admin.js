import apiClient from "./client";

export const adminVoteApi = {
  getStatus: (semester) =>
    apiClient.get("/admin/vote/status", { params: { semester } }),

  open: (semester, projectIds) =>
    apiClient.post(
      "/admin/vote/open",
      { projectIds },
      { params: { semester } },
    ),

  close: (semester) =>
    apiClient.post("/admin/vote/closed", {}, { params: { semester } }),

  getResults: (semester) => apiClient.get(`/admin/vote/${semester}/results`),

  getIsVoteOpen: (semester) =>
    apiClient.get(`/admin/vote/${semester}/results/visibility`),

  setPublicStatus: (semester, status) =>
    apiClient.post("/admin/vote/result", {}, { params: { semester, status } }),
};

export const adminPermissonApi = {
  updateUserRole: (newRole, selectedUserMap) =>
    apiClient.patch("/admin/role/user", {
      newRole: newRole,
      userIds: Array.from(selectedUserMap.keys()),
    }),

  getUserRoleList: (page, size, role, membershipLevel) =>
    apiClient.get("/admin/role", {
      params: {
        page,
        size,
        ...(role ? { role } : {}),
        ...(membershipLevel ? { membershipLevel } : {}),
      },
    }),
  updateMembershipLevel: (newMembershipLevel, selectedUserMap) =>
    apiClient.patch("/admin/role/user/membership-level", {
      newMembershipLevel,
      userIds: Array.from(selectedUserMap.keys()),
    }),
};

export const adminPlanApi = {
  createEvent: (eventBody) =>
    apiClient.post("/admin/calendar/event", eventBody),
};

export const adminAttendanceApi = {
  getEvents: () => apiClient.get("/calendar/events"),
  create: ({ title, date }) => apiClient.post("/admin/attendances", { title, date }),
  getList: () => apiClient.get("/admin/attendances"),
  getDetail: (attendanceId) => apiClient.get(`/admin/attendances/${attendanceId}`),
  changeStatus: (attendanceId, status) => apiClient.patch(`/admin/attendances/${attendanceId}`, { status }),
  updateParticipant: (attendanceId, userId, patch) =>
    apiClient.patch(`/admin/attendances/${attendanceId}/users/${userId}`, patch),
  remove: (attendanceId) => apiClient.delete(`/admin/attendances/${attendanceId}`),
  issueQr: (attendanceId) => apiClient.post(`/admin/attendances/${attendanceId}/qr`),
};

export const adminTeamBuildApi = {
  getApplies: () =>
    apiClient.get("/admin/team/applies/export", { responseType: "blob" }),

  getRecruits: () =>
    apiClient.get("/admin/team/recruits/export", { responseType: "blob" }),

  runTeamBuilding: () => apiClient.post("/admin/team/building/run"),

  getTeamBuildStatus: () => apiClient.get("/admin/team/building/status"),

  updateTeamBuildStatus: (semester, status) =>
    apiClient.patch("/admin/team/building/status", {
      semester: semester,
      status: status,
    }),

  createTeamBuild: () => apiClient.post("/admin/team/building/open/current"),

  resetTeamBuild: () => apiClient.post("/admin/team/building/reset/current"),
  resetTeamBuildCompletely: () =>
    apiClient.post("/admin/team/building/reset/current/complete"),
};
