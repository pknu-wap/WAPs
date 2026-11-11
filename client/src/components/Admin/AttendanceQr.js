import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { adminAttendanceApi } from "../../api/admin";
import styles from "../../assets/Admin/ManageAttendance.module.css";

const errorMessage = (error) => {
  switch (error.response?.status) {
    case 401:
      return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    case 403:
      return "QR 발급에는 관리자 권한이 필요합니다.";
    case 404:
      return "서버에서 출석체크를 찾을 수 없습니다.";
    case 409:
      return "진행 중인 출석체크에서만 QR을 발급할 수 있습니다.";
    default:
      return "QR을 발급하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
};

export default function AttendanceQr({ attendanceId, closed }) {
  const [qr, setQr] = useState(null);
  const [issued, setIssued] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const mounted = useRef(false);
  const validId = Number.isSafeInteger(attendanceId) && attendanceId > 0;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!qr) return undefined;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= qr.expiresAtMs) setQr(null);
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [qr]);

  const issueQr = async () => {
    if (pending.current || !validId || closed) return;
    pending.current = true;
    setLoading(true);
    setError("");
    setQr(null);
    try {
      const response = await adminAttendanceApi.issueQr(attendanceId);
      if (!mounted.current) return;
      const time = Date.now();
      const expiresAtMs = Date.parse(response.expiresAt);
      if (
        response.attendanceId !== attendanceId ||
        typeof response.qrToken !== "string" ||
        !response.qrToken.trim() ||
        !Number.isFinite(expiresAtMs) ||
        expiresAtMs <= time
      ) {
        setError("유효한 QR 응답을 받지 못했습니다. 다시 발급해 주세요.");
        return;
      }
      setNow(time);
      setQr({ ...response, expiresAtMs });
      setIssued(true);
    } catch (requestError) {
      if (mounted.current) setError(errorMessage(requestError));
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  const remaining = qr
    ? Math.max(0, Math.ceil((qr.expiresAtMs - now) / 1000))
    : 0;

  return (
    <section aria-label="출석체크 QR">
      <button
        type="button"
        className={styles.closeButton}
        onClick={issueQr}
        disabled={!validId || closed || loading}
        aria-busy={loading}
      >
        {loading ? "QR 발급 중…" : issued ? "QR 재발급" : "QR 생성"}
      </button>
      {!validId && (
        <p className={styles.storageNote}>
          서버 attendanceId가 없는 로컬 출석입니다. 출석 생성·목록 API 연동이
          필요합니다.
        </p>
      )}
      {closed && (
        <p className={styles.storageNote}>
          진행 중인 출석체크에서만 QR을 발급할 수 있습니다.
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {qr && remaining > 0 && !closed ? (
        <>
          <QRCodeSVG
            value={JSON.stringify({
              attendanceId: qr.attendanceId,
              qrToken: qr.qrToken,
            })}
            size={192}
            marginSize={4}
            title="출석체크 QR 코드"
          />
          <p role="timer">남은 시간: {remaining}초</p>
        </>
      ) : (
        issued &&
        !loading && (
          <p role="status">
            QR이 만료되었거나 무효화되었습니다. 다시 발급해 주세요.
          </p>
        )
      )}
    </section>
  );
}
