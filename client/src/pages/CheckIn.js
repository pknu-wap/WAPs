import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { attendanceApi } from "../api/attendance";
import "../assets/CheckIn.css";

const CheckIn = () => {
  const navigate = useNavigate();

  const [ongoingAttendance, setOngoingAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasValidated = useRef(false);

  useEffect(() => {
    if (hasValidated.current) return;

    hasValidated.current = true;

    const fetchAttendances = async () => {
      try {
        setIsLoading(true);

        const [ongoingData, endedData] = await Promise.all([
          attendanceApi.getAttendances("ONGOING"),
          attendanceApi.getAttendances("ENDED"),
        ]);

        if (
          !Array.isArray(ongoingData) ||
          ongoingData.length === 0
        ) {
          alert("출석이 존재하지 않습니다.");
          navigate("/ProjectPage");
          return;
        }

        setOngoingAttendance(ongoingData[0]);

        setAttendanceHistory(
          Array.isArray(endedData) ? endedData : []
        );
      } catch (error) {
        console.error("출석 정보 조회 실패:", error);

        alert("출석 정보를 불러오지 못했습니다.");
        navigate("/ProjectPage");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendances();
  }, [navigate]);

  const getStatusText = (status) => {
    if (status === "PRESENT") return "출석";
    if (status === "LATE") return "지각";
    return "미출석";
  };

  const handleQrScan = () => {
    if (!ongoingAttendance) return;

    navigate(`/CheckIn/scan/${ongoingAttendance.attendanceId}`);
  };

  return (
    <div className="checkin-page">
      <button
        className="checkin-close"
        onClick={() => navigate(-1)}
        aria-label="닫기"
      >
        ×
      </button>

      <div className="checkin-content">
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

          {isLoading ? (
            <div className="ongoing-card">
              출석 정보를 불러오는 중입니다.
            </div>
          ) : ongoingAttendance ? (
            <div className="ongoing-card">
              <div className="attendance-top">
                <div className="attendance-left">
                  <span className="attendance-dot attendance-dot-active" />

                  <div className="attendance-text">
                    <h3>{ongoingAttendance.title}</h3>

                    <p>
                      나의 출석 상태 :{" "}
                      {getStatusText(
                        ongoingAttendance.myStatus
                      )}
                    </p>
                  </div>
                </div>

                <span className="attendance-badge attendance-badge-active">
                  진행 중
                </span>
              </div>

              {ongoingAttendance.myStatus === "PRESENT" ? (
                <button
                  className="attendance-complete-button"
                  disabled
                >
                  출석이 완료되었습니다
                </button>
              ) : (
                <button
                  className="qr-button"
                  onClick={handleQrScan}
                >
                  출석 QR 찍기
                </button>
              )}
            </div>
          ) : null}
        </section>

        <div className="checkin-divider" />

        <section className="checkin-section history-section">
          <h2 className="checkin-section-title">
            나의 출석 기록
          </h2>

          <div className="history-list">
            {attendanceHistory.map((item) => (
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