import apiClient from "./client";

// 팀빌딩 API
export const teamBuildApi = {
    // 팀빌딩 결과 조회
    getTeamBuildResults: () => apiClient.get("/team-build/results"),
}