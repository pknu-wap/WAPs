import apiClient from "./client";

// 프로젝트 관련 API
export const projectApi = {
    // 프로젝트 목록보기
    getProjectList: (projectYear, semester) =>
        apiClient.get("/project/list", { params: { projectYear, semester } }),

    // 프로젝트 상세
    getProjectDetail: (projectId) =>
        apiClient.get(`/project/${projectId}`),

    // 프로젝트 수정 페이지 이동
    getprojectUpdatePage: (projectId) =>
        apiClient.get(`/project/${projectId}/update`),

    // 프로젝트 생성
    createProject: (projectData) =>
        apiClient.post("/project", projectData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    // 프로젝트 수정
    updateProject: (projectId, projectData) =>
        apiClient.put(`/project/${projectId}`, projectData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    // 프로젝트 삭제
    deleteProject: (projectId) =>
        apiClient.delete(`/project/${projectId}`),

};
