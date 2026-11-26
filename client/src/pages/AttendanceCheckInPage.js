import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import apiClient from "../api/client";
import authStorage from "../utils/authStorage";

const errorMessages = {
  400: "유효하지 않거나 만료된 QR입니다. 현재 QR을 다시 스캔해 주세요.",
  403: "해당 출석의 대상자가 아닙니다.",
  404: "출석 정보를 찾을 수 없습니다.",
  409: "현재 진행 중인 출석이 아닙니다.",
};

function AttendanceCheckIn({ attendanceId, qrToken }) {
  const request = useRef(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!request.current) {
      request.current = apiClient.post(`/attendances/${attendanceId}/check-in`, {
        qrToken,
      });
    }

    let active = true;
    request.current.then(
      () => {
        if (active) setResult({ succeeded: true });
      },
      (error) => {
        if (active) {
          setResult({
            message:
              errorMessages[error.response?.status] ??
              "출석 결과를 확인하지 못했습니다. 현재 QR을 다시 스캔해 주세요.",
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [attendanceId, qrToken]);

  if (result?.succeeded) return <Navigate to="/ProjectPage" replace />;
  if (result) return <p role="alert">{result.message}</p>;
  return <p role="status">출석을 확인하고 있습니다.</p>;
}

export default function AttendanceCheckInPage() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const attendanceId = params.get("attendanceId") ?? "";
  const qrToken = params.get("token");
  const validLink = /^[1-9][0-9]*$/.test(attendanceId) && qrToken?.trim();

  return (
    <main>
      <h1>QR 출석체크</h1>
      {!validLink ? (
        <p role="alert">출석 링크가 올바르지 않습니다. QR을 다시 스캔해 주세요.</p>
      ) : !authStorage.get("authToken") ? (
        <Navigate to="/login" replace state={{ attendanceSearch: search }} />
      ) : (
        <AttendanceCheckIn
          key={search}
          attendanceId={attendanceId}
          qrToken={qrToken}
        />
      )}
    </main>
  );
}
