import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "../assets/AttendanceCompleteDialog.module.css";

export default function AttendanceCompleteDialog({ onConfirm }) {
  const titleId = useId();
  const messageId = useId();
  const confirm = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirm.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return createPortal(
    <div className={styles.overlay}>
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className={styles.dialog}
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            confirm.current?.focus();
          } else if (event.key === "Escape") {
            event.preventDefault();
            onConfirm();
          }
        }}
      >
        <span className={styles.check} aria-hidden="true">✓</span>
        <h2 id={titleId}>출석 완료</h2>
        <p id={messageId}>출석체크가 완료되었습니다.</p>
        <button ref={confirm} type="button" onClick={onConfirm}>확인</button>
      </section>
    </div>,
    document.body,
  );
}
