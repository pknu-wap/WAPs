import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./AttendanceMemberPreviewPage.module.css";

export default function AttendanceMemberPreviewPage() {
  const [params] = useSearchParams();
  const [tested, setTested] = useState(false);
  if (process.env.NODE_ENV !== "development") return null;
  const validExample = params.get("preview") === "1" && /^[1-9]\d*$/.test(params.get("sequence") || "");

  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="member-preview-title">
      <p className={styles.brand}>WAPs · LOCAL PREVIEW</p>
      <h1 id="member-preview-title">회원 출석체크</h1>
      <p className={styles.notice}>개발용 화면 확인입니다. 로그인·서버 연결·실제 출석 처리는 하지 않습니다.</p>
      {validExample ? <>
        <h2>예시 정기 모임</h2>
        <p>예시 회원 A 님의 화면입니다.</p>
        <dl className={styles.details}>
          <div><dt>행사</dt><dd>정기 모임 (예시)</dd></div>
          <div><dt>회원 구분</dt><dd>신입 (예시)</dd></div>
          <div><dt>출석 상태</dt><dd>저장하지 않음</dd></div>
        </dl>
        <button className={styles.button} disabled={tested} onClick={() => setTested(true)}>
          {tested ? "화면 테스트 완료" : "출석 버튼 테스트 (저장 안 됨)"}
        </button>
        {tested && <p role="status" className={styles.notice}>버튼 동작을 확인했습니다. 실제 출석은 기록되지 않았습니다.</p>}
      </> : <p role="alert">관리자 미리보기에서 테스트 QR을 생성한 뒤 스캔해 주세요.</p>}
      <p className={styles.footer}>이 화면은 waps.im 서비스가 아닌 로컬 미리보기입니다.</p>
    </section>
  </main>;
}
