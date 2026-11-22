import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calendarApi } from "../api/calendar";
import "../assets/CalendarPage.css";

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const fetchEvents = async () => {
      try {
        const data = await calendarApi.getEvents();
        if (active) setEvents(data);
      } catch (error) {
        if (active) setError("일정을 불러오지 못했습니다. 다시 시도해주세요.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchEvents();
    return () => {
      active = false;
    };
  }, [revision]);

  return (
    <div className="calendar-page">
      <button className="close-btn" onClick={() => navigate("/ProjectPage")}>
        ✕
      </button>

      {/* 제목 및 설명 */}
      <h1 className="calendar-title">CALENDAR</h1>
      <p className="calendar-desc">WAP의 일정들을 보기 쉽게 확인하세요</p>

      {/* 일정 리스트 영역 */}
      <div className={`calendar-list ${events.length === 0 ? "empty" : ""}`}>
        {loading ? (
          <p role="status">일정을 불러오는 중입니다...</p>
        ) : error ? (
          <div>
            <p role="alert">{error}</p>
            <button onClick={() => setRevision((value) => value + 1)}>
              다시 시도
            </button>
          </div>
        ) : events.length > 0 ? (
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
