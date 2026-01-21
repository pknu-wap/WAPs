import apiClient from "./client";

// 캘린더 페이지 api
export const calendarApi = {
    // 만료되지 않은 모든 이벤트 가져오기
    getEvents: () => apiClient.get("/calendar/events"),
};