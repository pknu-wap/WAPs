import apiClient from "./client";

// 프로젝트 관련 API
export const projectApi = {
  getMemberOptions: () => apiClient.get("/project/members"),

  // 현재 서버 기준 학기
  getCurrentSemester: () => apiClient.get("/project/semester/current"),

  // 프로젝트 목록보기
  getProjectList: (semester) =>
    apiClient.get("/project/list", { params: { semester } }),

  // 프로젝트 상세
  getProjectDetail: (projectId) => apiClient.get(`/project/${projectId}`),

  // 프로젝트 수정 페이지 이동
  getprojectUpdatePage: (projectId) =>
    apiClient.get(`/project/${projectId}/update`),

  // 프로젝트 생성
  createProject: (projectData, onUploadProgress) =>
    apiClient.post("/project", projectData, {
      timeout: 10000,
      onUploadProgress,
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // 프로젝트 수정
  updateProject: (projectId, projectData, onUploadProgress) =>
    apiClient.put(`/project/${projectId}`, projectData, {
      timeout: 10000,
      onUploadProgress,
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // 프로젝트 삭제
  deleteProject: (projectId) => apiClient.delete(`/project/${projectId}`),
};
