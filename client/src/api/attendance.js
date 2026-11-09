import apiClient from "./client";

export const attendanceApi = {
  getAttendances: (status = "ONGOING") =>
    apiClient.get("/attendances", {
      params: {
        status,
      },
    }),

  checkIn: (attendanceId, qrToken) =>
    apiClient.post(`/attendances/${attendanceId}/check-in`, {
      qrToken,
    }),
};