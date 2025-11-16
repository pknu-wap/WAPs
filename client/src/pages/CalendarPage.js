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

        if (!response.ok) throw new Error("Failed to fetch events");

        const data = await response.json();

        setEvents(data);

      } catch (error) {
        console.error("일정 데이터를 불러오지 못했습니다:", error);

        // 테스트용 더미 데이터
        const dummyData = [
          {
            date: "2025-12-01",
            title: "10/1(수) 개모임 안내",
            content: `연사자
            구교황 - “스택 메모리가 무한정으로 커지면 힙 메모리는 필요 없을까?”에 대한 고찰
            김균호 - 내 프로젝트에 100만명의 사용자가 몰려든다면!
            조강래 - 배포 후 추가로 학습하면 좋은 것
            김성준 - TSP문제의 여러 알고리즘과 현재 연구단계
            김민철 - 제노사이드 로직 파헤치기`,
            target: "신입필참!",
          },
          {
            date: "2025-12-5 15:00",
            title: "부스팅데이",
            content: "온라인 Zoom에서 부스팅 데이가 진행됩니다.",
            target: "신입 필참 (정회원 참여 가능)",
          },
          {
            date: "2025-12-07 18:30",
            title: "2025년도 2학기 중간 발표",
            content: "향파관 401호 강의실에서 중간 발표가 진행됩니다.",
            target: "프로젝트 참여 인원",
          },
          {
            date: "2025-12-15",
            title: "팀별 코드 리뷰 세션",
            content: "프로젝트별 코드 리뷰가 진행됩니다.",
            target: "모두",
          },
        ];

        setEvents(dummyData);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="calendar-page">
      <button className="close-btn" onClick={() => navigate("/ProjectPage")}>
        ✕
      </button>

      {/* 제목 및 설명 */}
      <h1 className="calendar-title">CALENDAR</h1>
      <p className="calendar-desc">WAP의 일정들을 보기 쉽게 확인하세요</p>

      {/* 일정 리스트 영역 */}
      <div className="calendar-list">
        {events.length > 0 ? (
          events.map((event, index) => (
            <div key={index} className="schedule-wrapper">
              <div className="schedule-box">
                <div className="schedule-date">{event.date}</div>
                <div className="schedule-title">{event.title}</div>

                {/* 여러 줄 내용 표시 (줄바꿈 유지) */}
                <div className="schedule-content">
                  {event.content.split("\n").map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
                <div className="target-box">#{event.target}</div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-event">다가오는 일정이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;