import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QrScanner from "qr-scanner";
import { attendanceApi } from "../api/attendance";
import AttendanceCompleteDialog from "../components/AttendanceCompleteDialog";
import "../assets/CheckInScan.css";

const CheckInScan = () => {
  const { attendanceId } = useParams();
  return <ScanSession key={attendanceId} attendanceId={attendanceId} />;
};

function ScanSession({ attendanceId }) {
  const navigate = useNavigate();
  const video = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    let processing = false;

    const parseQrData = (decodedText) => {
      try {
        const parsed = JSON.parse(decodedText);

        if (parsed.qrToken) {
          return {
            attendanceId:
              parsed.attendanceId ?? attendanceId,
            qrToken: parsed.qrToken,
          };
        }
      } catch {}

      try {
        const url = new URL(decodedText);

        const qrAttendanceId =
          url.searchParams.get("attendanceId");

        const qrToken =
          url.searchParams.get("token") || url.searchParams.get("qrToken");

        if (qrToken) {
          return {
            attendanceId:
              qrAttendanceId ?? attendanceId,
            qrToken,
          };
        }
      } catch {}

      return {
        attendanceId,
        qrToken: decodedText,
      };
    };

    const handleScanSuccess = async ({ data: decodedText }) => {
      if (!active || processing) return;

      processing = true;

      try {
        const qrData = parseQrData(decodedText);

        if (!qrData.qrToken) {
          throw new Error("QR 토큰이 없습니다.");
        }

        if (!qrData.attendanceId) {
          throw new Error("출석 ID가 없습니다.");
        }

        if (
          String(qrData.attendanceId) !==
          String(attendanceId)
        ) {
          throw new Error(
            "현재 출석과 다른 QR 코드입니다."
          );
        }

        await attendanceApi.checkIn(
          qrData.attendanceId,
          qrData.qrToken
        );

        if (!active) return;
        setErrorMessage("");
        setCompleted(true);
        scanner.stop();
      } catch (error) {
        if (!active) return;
        console.error("출석체크 실패:", error);

        const status = error?.response?.status;

        if (status === 401) {
          setErrorMessage(
            "로그인이 만료되었습니다. 다시 로그인해주세요."
          );
        } else if (status === 403) {
          setErrorMessage(
            "해당 출석체크의 대상자가 아닙니다."
          );
        } else if (status === 404) {
          setErrorMessage(
            "출석체크를 찾을 수 없습니다."
          );
        } else if (status === 409) {
          setErrorMessage(
            "현재 진행할 수 없는 출석체크입니다."
          );
        } else {
          setErrorMessage(
            "유효하지 않거나 만료된 QR 코드입니다."
          );
        }

        processing = false;
      }
    };

    const scanner = new QrScanner(video.current, handleScanSuccess, {
      preferredCamera: "environment",
      maxScansPerSecond: 10,
      returnDetailedScanResult: true,
    });
    Promise.resolve().then(async () => {
      if (!active) return;
      try {
        await scanner.start();
      } catch (error) {
        if (active) {
          console.error("카메라 실행 실패:", error);
          setErrorMessage("카메라를 실행할 수 없습니다.");
        }
      }
    });

    return () => {
      active = false;
      scanner.destroy();
    };
  }, [attendanceId]);

  return (
    <div className="qr-scan-page">
      {completed && <AttendanceCompleteDialog onConfirm={() => navigate("/CheckIn", { replace: true })} />}
      <video ref={video} className="qr-scan-video" muted playsInline aria-label="QR 스캔 카메라" />

      <button
        className="qr-scan-close"
        onClick={() => navigate(-1)}
        aria-label="닫기"
      >
        ×
      </button>

      <div className="qr-scan-guide">
        <p>칸 안에 QR을 인식시켜 주세요</p>

        <div className="qr-frame">
          <span className="top-left" />
          <span className="top-right" />
          <span className="bottom-left" />
          <span className="bottom-right" />
        </div>

        {errorMessage && (
          <p className="qr-error-message">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default CheckInScan;
