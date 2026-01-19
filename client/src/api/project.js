import apiClient from "../client";

// 프로젝트 관련 API
export const projectApi = {
    // 프로젝트 목록보기
    getProjectList: (projectYear, semester) =>
        apiClient.get("/project/list", { params: { projectYear, semester } }),
};