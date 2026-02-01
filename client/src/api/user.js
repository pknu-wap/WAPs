import apiClient from "./client";

// 사용자 관련 API
export const userApi = {
    // 회원 역할 선택
    selectRole: (role) => {
        const url = role === "member" ? "/user/role/member" : "/user/role/guest";
        return apiClient.post(url, {});
    },
    // 내 정보 조회
    getMe: () => apiClient.get("/user/me"),

}