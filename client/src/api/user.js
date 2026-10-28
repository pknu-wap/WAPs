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

  updateName: (name) =>
    apiClient.patch("/user/me", {
      name,
    }),
};