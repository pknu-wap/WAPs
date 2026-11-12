import apiClient from "./client";

export const userApi = {
  selectRole: (role) => {
    const url =
      role === "member"
        ? "/user/role/member"
        : "/user/role/guest";

    return apiClient.post(url, {});
  },

  getMe: () => apiClient.get("/user/me"),

  completeRegistration: (registration) =>
    apiClient.post("/user/registration", registration),

  updateName: (name) =>
    apiClient.patch("/api/member/name", {
      name,
    }),
};