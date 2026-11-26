import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { attendanceApi } from "../api/attendance";
import PageBrand from "../components/PageBrand";
import "../assets/CheckIn.css";

const CheckIn = () => {
  const navigate = useNavigate();

  const [ongoingAttendances, setOngoingAttendances] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchAttendances = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [ongoingData, endedData] = await Promise.all([
          attendanceApi.getAttendances("ONGOING"),
          attendanceApi.getAttendances("ENDED"),
        ]);

        if (!active) return;
        setOngoingAttendances(ongoingData);

        setAttendanceHistory(
          Array.isArray(endedData) ? endedData : []
        );
      } catch (error) {
        if (!active) return;
        console.error("출석 정보 조회 실패:", error);

        setError("출석 정보를 불러오지 못했습니다. 다시 시도해주세요.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchAttendances();
    return () => { active = false; };
  }, []);

  const getStatusText = (status) => {
    if (status === "PRESENT") return "출석";
    if (status === "LATE") return "지각";
    return "미출석";
  };

  return (
    <div className="checkin-page">
      <PageBrand />
      <button
        className="checkin-close"
        onClick={() => navigate(-1)}
        aria-label="닫기"
      >
        ×
      </button>

      <div className="checkin-content">
        {error && <p role="alert">{error}</p>}
        <div className="checkin-title-area">
          <h1>
            ATTENDANCE
            <br />
            CHECK
          </h1>

          <p>출석체크를 진행하고, 출석 기록을 확인해보세요</p>
        </div>

        <section className="checkin-section">
          <h2 className="checkin-section-title">
            진행중인 출석
          </h2>

          {isLoading && (
            <div className="ongoing-card">
              출석 정보를 불러오는 중입니다.
            </div>
          )}
          {!isLoading && !error && ongoingAttendances.length === 0 && <p>진행 중인 출석이 없습니다.</p>}
          {ongoingAttendances.map((attendance) => (
            <div className="ongoing-card" key={attendance.attendanceId}>
              <div className="attendance-top">
                <div className="attendance-left">
                  <span className="attendance-dot attendance-dot-active" />

                  <div className="attendance-text">
                    <h3>{attendance.title}</h3>

                    <p>
                      나의 출석 상태 :{" "}
                      {getStatusText(
                        attendance.myStatus
                      )}
                    </p>
                  </div>
                </div>

                <span className="attendance-badge attendance-badge-active">
                  진행 중
                </span>
              </div>

              {!["PRESENT", "LATE"].includes(attendance.myStatus) && (
                <button
                  className="qr-button"
                  onClick={() => navigate(`/CheckIn/scan/${attendance.attendanceId}`)}
                >
                  출석 QR 찍기
                </button>
              )}
            </div>
          ))}
        </section>

        <div className="checkin-divider" />

        <section className="checkin-section history-section">
          <h2 className="checkin-section-title">
            나의 출석 기록
          </h2>

          <div className="history-list">
            {!isLoading && !error && attendanceHistory.length === 0 && <p>출석 기록이 없습니다.</p>}
            {!isLoading && !error && attendanceHistory.map((item) => (
              <div
                className="history-card"
                key={item.attendanceId}
              >
                <div className="attendance-top">
                  <div className="attendance-left">
                    <span className="attendance-dot" />

                    <div className="attendance-text">
                      <h3>{item.title}</h3>

                      <p>
                        나의 출석 상태 :{" "}
                        {getStatusText(item.myStatus)}
                      </p>
                    </div>
                  </div>

                  <span className="attendance-badge">
                    종료
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CheckIn;
