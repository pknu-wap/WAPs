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

// 팀빌딩 관리 API
export const adminTeamBuildApi = {
    // 지원 현황 반환
    getApplies: () =>
        apiClient.get("/admin/team/applies/export"),

    // 모집 현황 반환
    getRecruits: () =>
        apiClient.get("/admin/team/recruits/export"),

    // 팀빌딩 알고리즘 실행
    runTeamBuilding: () =>
        apiClient.post("/admin/team/building/run"),

    // 팀 빌딩 상태 조회
    getTeamBuildStatus: (semester) =>
        apiClient.get("/admin/team/building/status", { params: { semester } }),

    // 팀 빌딩 상태 변경
    updateTeamBuildStatus: (semester) =>
        apiClient.patch("/admin/team/building/status", {}, { params: { semester } }),

    // 현재 학기 팀빌딩 기능 생성
    createTeamBuild: () =>
        apiClient.post("/admin/team/building/open/current"),
}