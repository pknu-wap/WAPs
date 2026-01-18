import apiClient from "../client";

// 투표 관리 페이지 API
export const adminVoteApi = {
    // 투표 상태 조회
    getStatus: (semester) =>
        apiClient.get("/admin/vote/status", { params: { semester } }),

    // 투표 열기
    open: (semester, projectIds) =>
        apiClient.post("/admin/vote/open", { projectIds }, { params: { semester } }),

    // 투표 종료
    close: (semester) =>
        apiClient.post("/admin/vote/closed", {}, { params: { semester } }),

    // 투표 결과 조회
    getResults: (semester) =>
        apiClient.get(`/admin/vote/${semester}/results`),

    // 투표 결과 공개 여부 조회
    getIsVoteOpen: (semester) =>
        apiClient.get(`/admin/vote/${semester}/results/visibility`),

    // 투표 결과 공개 여부 설정
    setPublicStatus: (semester, status) =>
        apiClient.post("/admin/vote/result", {}, { params: { semester, status } })
};