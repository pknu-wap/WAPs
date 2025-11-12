import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/CalendarPage.css";

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/calendar/events", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        const sorted = data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setEvents(sorted);
      } catch (error) {
        console.error("일정 데이터를 불러오지 못했습니다:", error);

        // 테스트용 더미 데이터
        const dummyData = [
          {
            date: "2025-12-20 19:00",
            title: "송년회 일정",
            content: "부경대 인근 식당에서 송년회가 있습니다.",
            target: "송년회 오고 싶은 사람",
          },
          {
            date: "2025-11-10 15:00",
            title: "부스팅데이",
            content: "온라인 Zoom에서 부스팅 데이가 진행됩니다.",
            target: "신입 필참 (정회원 참여 가능)",
          },
          {
            date: "2025-11-05 18:30",
            title: "2025년도 2학기 중간 발표",
            content: "향파관 401호 강의실에서 중간 발표가 진행됩니다.",
            target: "프로젝트 참여 인원",
          },
          {
            date: "2025-10-15 10:00",
            title: "팀별 코드 리뷰 세션",
            content: "프로젝트별 코드 리뷰가 진행됩니다.",
            target: "",
          },
        ];

        // 최신순 정렬 (가장 최신이 위)
        const sortedDummy = dummyData.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setEvents(sortedDummy);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="calendar-page">
      <button className="close-btn" onClick={() => navigate("/ProjectPage")}>
        ✕
      </button>

      {/* 헤더 */}
      <h1 className="calendar-title">CALENDAR</h1>
      <p className="calendar-desc">WAP의 일정들을 보기 쉽게 확인하세요</p>

      {/* 일정 리스트 */}
      <div className="calendar-list">
        {events.map((event, index) => (
          <div key={index} className="schedule-wrapper">
            <div className="schedule-box">
              <div className="schedule-date">{event.date}</div>
              <div className="schedule-title">{event.title}</div>
              <div className="schedule-content">{event.content}</div>
            </div>

            {/* 참가대상 있을 때만 출력 */}
            {event.target && event.target.trim() !== "" && (
              <div className="target-box">#{event.target}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarPage;
