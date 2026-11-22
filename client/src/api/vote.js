import apiClient from "./client";

// 투표 API
export const voteApi = {
  getParticipants: (semester) => apiClient.get(`/vote/${semester}/projects`),
  getMyVote: (semester) => apiClient.get(`/user/vote/${semester}`),
  submitVote: (vote) => apiClient.post("/vote", vote),

  // 투표 상태 확인
  getVoteNow: () => apiClient.get("/vote/now"),

  // 투표 결과 확인
  getVoteResult: (semester) => {
    return semester
      ? apiClient.get(`/vote/result/${semester}`)
      : apiClient.get("/vote/result");
  },
};
