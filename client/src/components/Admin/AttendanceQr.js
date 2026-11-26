import { useCallback, useEffect, useId, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { adminAttendanceApi } from "../../api/admin";
import qrStyles from "../../assets/Admin/AttendanceQr.module.css";
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
  const [openId, setOpenId] = useState(null);
  const validId = Number.isSafeInteger(attendanceId) && attendanceId > 0;

  useEffect(() => setOpenId(null), [attendanceId, closed]);

  return (
    <section aria-label="출석체크 QR">
      <button
        type="button"
        className={styles.closeButton}
        disabled={!validId || closed}
        onClick={() => setOpenId(attendanceId)}
      >
        QR 생성
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
      {validId && !closed && openId === attendanceId && (
        <AttendanceQrDialog
          key={attendanceId}
          attendanceId={attendanceId}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  );
}

function AttendanceQrDialog({ attendanceId, onClose }) {
  const [qr, setQr] = useState(null);
  const [now, setNow] = useState(Date.now);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const mounted = useRef(false);
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const issueQr = useCallback(async () => {
    if (pending.current) return;
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
      setQr({
        ...response,
        expiresAtMs,
        refreshAtMs: Math.min(time + 60000, expiresAtMs),
      });
    } catch (requestError) {
      if (mounted.current) setError(errorMessage(requestError));
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [attendanceId]);

  useEffect(() => {
    if (!qr) return undefined;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= qr.refreshAtMs) {
        window.clearInterval(timer);
        issueQr();
      }
    };
    const timer = window.setInterval(tick, 250);
    const resume = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", resume);
    tick();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [qr, issueQr]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    issueQr();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [issueQr]);

  const remaining = qr
    ? Math.max(0, Math.ceil((qr.refreshAtMs - now) / 1000))
    : 0;

  return (
    <dialog
      ref={dialogRef}
      className={qrStyles.qrDialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={qrStyles.dialogContent}>
        <button
          type="button"
          className={qrStyles.closeModal}
          onClick={onClose}
          aria-label="QR 모달 닫기"
        >
          ✕
        </button>
        <h2 id={titleId}>출석체크 QR</h2>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {qr && remaining > 0 && (
          <>
            <div className={qrStyles.qrFrame}>
              <QRCodeSVG
                className={qrStyles.largeQr}
                value={`${window.location.origin}/attendance?${new URLSearchParams(
                  {
                    attendanceId: qr.attendanceId,
                    token: qr.qrToken,
                  },
                )}`}
                size={480}
                marginSize={4}
                title="출석체크 QR 코드"
              />
            </div>
            <p role="timer">남은 시간: {remaining}초</p>
          </>
        )}
        <button
          type="button"
          className={qrStyles.regenerateButton}
          onClick={issueQr}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "QR 발급 중…" : "QR 재발급"}
        </button>
      </div>
    </dialog>
  );
}
