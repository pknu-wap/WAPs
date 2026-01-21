import apiClient from "./client";

// 기술 스택 API
export const stackApi = {
    // 기술 스택 조회
    getTechStack: () => apiClient.get("/techStack/list"),

}