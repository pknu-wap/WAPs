import apiClient from "./client";

// 댓글 API

export const commentApi = {
    // 댓글 작성
    addComment: (projectId, commentData) =>
        apiClient.post(`/comment/${projectId}`, commentData),

    // 댓글 삭제
    deleteComment: (commentId) =>
        apiClient.delete(`/comment/${commentId}`),
}