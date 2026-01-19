import apiClient from "./client";

// 투표 관리 API
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

// 권한 관리 API
export const adminPermissonApi = {
    // 사용자 권한 변경
    updateUserRole: (newRole, selectedUserMap) =>
        apiClient.patch("/admin/role/user", {
            newRole: newRole, userIds: Array.from(selectedUserMap.keys())
        }),

    // 사용자 권한 목록 가져오기
    getUserRoleList: (page, size, role) =>
        apiClient.get("/admin/role", {
            params: { page: page, size: size, ...(role ? { role: role } : {}) }
        }),
}

// 일정 관리 API
export const adminPlanApi = {
    // 캘린더 이벤트 등록
    createEvent: (eventBody) =>
        apiClient.post("/admin/calendar/event", eventBody),
}