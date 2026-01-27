import apiClient from "./client";

// 팀빌딩 API
export const teamBuildApi = {
    // 팀빌딩 결과 조회
    getTeamBuildResults: () => apiClient.get("/team-build/results"),
    // 리더 모집하기 - 프로젝트 지원자 조회
    getRecruitApplies: (projectId) => apiClient.get(`/team-build/${projectId}/applies`),
    // 리더 모집하기 - 우선순위 제출
    submitRecruitPreference: (payload) => apiClient.post("/team-build/recruit/submit", payload),
    // 현재 사용자 역할 조회
    getRole: () => apiClient.get("/team-build/role"),
}
