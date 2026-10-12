import React from "react";
import { useNavigate } from "react-router-dom";
import "../assets/CheckIn.css";

const CheckIn = () => {
  const navigate = useNavigate();

  // 백엔드 연결 전 임시 데이터
  const ongoingAttendance = {
    id: 1,
    title: "시작발표",
    status: "ABSENT",
  };

  const attendanceHistory = [
    {
      id: 2,
      title: "신입 OT&프로젝트 세미나",
      status: "PRESENT",
    },
    {
      id: 3,
      title: "깃세미나",
      status: "ABSENT",
    },
    {
      id: 4,
      title: "개강총회&팀빌딩",
      status: "LATE",
    },
    {
      id: 5,
      title: "AI 세미나",
      status: "PRESENT",
    },
  ];

  const getStatusText = (status) => {
    if (status === "PRESENT") return "출석";
    if (status === "LATE") return "지각";
    return "미출석";
  };

  const handleQrScan = () => {
    navigate(`/CheckIn/scan/${ongoingAttendance.id}`);
  };

  return (
    <div className="checkin-page">
      {/* 닫기 버튼 */}
      <button
        className="checkin-close"
        onClick={() => navigate(-1)}
        aria-label="닫기"
      >
        ×
      </button>

      <div className="checkin-content">
        {/* 제목 */}
        <div className="checkin-title-area">
          <h1>
            ATTENDANCE
            <br />
            CHECK
          </h1>

          <p>출석체크를 진행하고, 출석 기록을 확인해보세요</p>
        </div>

        {/* 진행중인 출석 */}
        <section className="checkin-section">
          <h2 className="checkin-section-title">진행중인 출석</h2>

          <div className="ongoing-card">
            <div className="attendance-top">
              <div className="attendance-left">
                <span className="attendance-dot attendance-dot-active" />

                <div className="attendance-text">
                  <h3>{ongoingAttendance.title}</h3>

                  <p>
                    나의 출석 상태 :{" "}
                    {getStatusText(ongoingAttendance.status)}
                  </p>
                </div>
              </div>

              <span className="attendance-badge attendance-badge-active">
                진행 중
              </span>
            </div>

            {ongoingAttendance.status === "PRESENT" ? (
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
        </section>

        <div className="checkin-divider" />

        {/* 나의 출석 기록 */}
        <section className="checkin-section history-section">
          <h2 className="checkin-section-title">나의 출석 기록</h2>

          <div className="history-list">
            {attendanceHistory.map((item) => (
              <div className="history-card" key={item.id}>
                <div className="attendance-top">
                  <div className="attendance-left">
                    <span className="attendance-dot" />

                    <div className="attendance-text">
                      <h3>{item.title}</h3>

                      <p>
                        나의 출석 상태 : {getStatusText(item.status)}
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