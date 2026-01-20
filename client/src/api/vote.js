import apiClient from "./client";

// 투표 API
export const voteApi = {
    // 투표 상태 확인
    getVoteNow: () => apiClient.get("/vote/now"),
}