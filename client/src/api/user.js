import apiClient from "./client";

// 사용자 관련 API
export const userApi = {
  // 회원 역할 선택
  signup: (registration) => apiClient.post("/user/signup", registration),
  getRole: () => apiClient.get("/user/role"),
  // 내 정보 조회
  getMe: () => apiClient.get("/user/me"),
  updateName: (name) => apiClient.patch("/api/member/name", { name }),
};
