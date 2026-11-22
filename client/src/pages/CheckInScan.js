import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { attendanceApi } from "../api/attendance";
import "../assets/CheckInScan.css";

const CheckInScan = () => {
  const navigate = useNavigate();
  const { attendanceId } = useParams();

  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");

    scannerRef.current = scanner;

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
          url.searchParams.get("qrToken");

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

    const handleScanSuccess = async (decodedText) => {
      if (isProcessingRef.current) return;

      isProcessingRef.current = true;

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

        if (scanner.isScanning) {
          await scanner.stop();
        }

        await attendanceApi.checkIn(
          qrData.attendanceId,
          qrData.qrToken
        );

        navigate("/CheckIn", {
          replace: true,
        });
      } catch (error) {
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

        isProcessingRef.current = false;
      }
    };

    const startScanner = async () => {
      try {
        await scanner.start(
          {
            facingMode: "environment",
          },
          {
            fps: 10,
          },
          handleScanSuccess,
          () => {}
        );
      } catch (error) {
        console.error("카메라 실행 실패:", error);

        setErrorMessage(
          "카메라를 실행할 수 없습니다."
        );
      }
    };

    startScanner();

    return () => {
      if (scanner.isScanning) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [attendanceId, navigate]);

  const handleClose = async () => {
    try {
      if (
        scannerRef.current &&
        scannerRef.current.isScanning
      ) {
        await scannerRef.current.stop();
      }
    } catch (error) {
      console.error("QR 스캐너 종료 실패:", error);
    }

    navigate(-1);
  };

  return (
    <div className="qr-scan-page">
      <div id="qr-reader" />

      <button
        className="qr-scan-close"
        onClick={handleClose}
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
};

export default CheckInScan;