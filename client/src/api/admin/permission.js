import apiClient from "../client";

// 권한 관리 관련 API
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