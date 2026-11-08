import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import styles from "../../assets/Admin/ManageAttendance.module.css";
import previewStyles from "./AttendancePreviewPage.module.css";

const EXAMPLES = [
  { id: "preview-ongoing", title: "예시 정기 모임", date: "2026-11-07", status: "ONGOING" },
  { id: "preview-scheduled", title: "예시 예정 모임", date: "2026-11-14", status: "SCHEDULED" },
  { id: "preview-ended", title: "예시 종료 모임", date: "2026-10-31", status: "ENDED" },
];
const MEMBERS = [
  { id: "example-a", name: "예시 회원 A", level: "신입", status: "PRESENT", note: "화면 확인용 예시" },
  { id: "example-b", name: "예시 회원 B", level: "준회원", status: "ABSENT", note: "" },
  { id: "example-c", name: "예시 회원 C", level: "정회원", status: "ABSENT", note: "" },
];
const dateLabel = (date) => new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
}).format(new Date(`${date}T00:00:00`));

function PreviewQr({ ongoing }) {
  const [sequence, setSequence] = useState(0);
  const [expiresAt, setExpiresAt] = useState(null);
  const [now, setNow] = useState(Date.now);
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) dialogRef.current.showModal();
  }, [isOpen]);

  const closeModal = () => {
    dialogRef.current?.close();
    setIsOpen(false);
    setExpiresAt(null);
  };

  useEffect(() => {
    if (expiresAt === null) return undefined;
    let deadline = expiresAt;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= deadline) {
        deadline = time + 60000;
        setSequence((current) => current + 1);
        setExpiresAt(deadline);
      }
    };
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const generate = () => {
    const time = Date.now();
    setSequence((current) => current + 1);
    setNow(time);
    setExpiresAt(time + 60000);
    setIsOpen(true);
  };
  const remaining = expiresAt === null ? 0 : Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const memberUrl = new URL("https://waps.im/attendance");
  memberUrl.search = new URLSearchParams({ preview: "1", sequence: String(sequence) }).toString();

  return (
    <section aria-label="미리보기 테스트 QR">
      <button type="button" className={styles.closeButton} disabled={!ongoing} onClick={generate}>
        {sequence ? "테스트 QR 재발급" : "QR 생성 (테스트용)"}
      </button>
      <p className={styles.storageNote}>출석 페이지 링크 연결용 테스트 QR입니다. 실제 출석 토큰과 개인정보는 전송하지 않습니다.</p>
      <p className={styles.storageNote}>생성 후 60초마다 테스트 QR이 자동으로 갱신됩니다.</p>
      {ongoing && isOpen && <dialog ref={dialogRef} className={previewStyles.qrDialog}
        aria-labelledby="preview-qr-title" aria-describedby="preview-qr-description"
        onCancel={(event) => { event.preventDefault(); closeModal(); }}
        onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
        <div className={previewStyles.dialogContent}>
        <button type="button" className={previewStyles.closeModal} onClick={closeModal} autoFocus aria-label="QR 모달 닫기">✕</button>
        <h2 id="preview-qr-title">테스트용 출석 QR</h2>
        <p id="preview-qr-description">waps.im 출석 페이지로 연결합니다. 실제 출석 토큰이 없는 테스트 링크입니다.</p>
        <QRCodeSVG className={previewStyles.largeQr} size={480} marginSize={4} title="출석 처리 불가 · 테스트용 QR"
          value={memberUrl.href} />
        <p><a href={memberUrl.href} target="_blank" rel="noreferrer">waps.im 출석 페이지 열기</a></p>
        <p role="timer">테스트 QR 남은 시간: {remaining}초</p>
        <p>60초마다 새 테스트 QR로 자동 갱신됩니다.</p>
        <button type="button" className={styles.closeButton} onClick={generate}>지금 새 QR 생성</button>
        </div>
      </dialog>}
    </section>
  );
}

export default function AttendancePreviewPage() {
  const [selectedId, setSelectedId] = useState(EXAMPLES[0].id);
  const [searchName, setSearchName] = useState("");
  const [sortBy, setSortBy] = useState("role");
  const [direction, setDirection] = useState(1);
  const selected = EXAMPLES.find((session) => session.id === selectedId);
  const visible = useMemo(() => MEMBERS.filter((member) => member.name.includes(searchName.trim()))
    .slice().sort((a, b) => {
      const left = sortBy === "role" ? a.level : a[sortBy];
      const right = sortBy === "role" ? b.level : b[sortBy];
      if (sortBy === "role") return (["신입", "준회원", "정회원"].indexOf(left) - ["신입", "준회원", "정회원"].indexOf(right)) * direction;
      return left.localeCompare(right, "ko") * direction;
    }), [searchName, sortBy, direction]);

  if (process.env.NODE_ENV !== "development") return null;

  const changeSort = (column) => {
    if (sortBy === column) setDirection((current) => -current);
    else { setSortBy(column); setDirection(1); }
  };
  const renderSession = (session) => {
    const closed = session.status === "ENDED";
    return (
      <button key={session.id} className={`${styles.sessionCard} ${closed ? styles.closedCard : ""} ${selectedId === session.id ? styles.selected : ""}`}
        onClick={() => { setSelectedId(session.id); setSearchName(""); }}>
        <span className={styles.sessionTop}>
          <span className={styles.statusDot} /><span className={styles.sessionName}>{session.title}</span>
          <span className={styles.sessionDate}>{dateLabel(session.date)}</span>
          <span className={closed ? styles.resultTag : styles.manageTag}>{closed ? "출석 결과" : session.status === "SCHEDULED" ? "출석 예정" : "출석 관리"}</span>
        </span>
        <span className={styles.sessionCounts}>시각: 미리보기 예시</span>
        <span className={styles.sessionCounts}>예시 출석 : 1명 <span>지각 : 미지원</span><span>예시 미출석 : 2명</span></span>
      </button>
    );
  };

  return (
    <main className={styles.page}>
      <section className={styles.listPanel} aria-label="출석 체크 목록">
        <header className={styles.panelHeader}>
          <div><h1>ATTENDANCE CHECK</h1><p>출석 체크 생성 &amp; 출석 현황 확인</p></div>
          <button className={styles.mobileAdd} onClick={() => setSelectedId(null)} aria-label="출석 체크 만들기">＋</button>
        </header>
        <p className={styles.error} role="note">개발용 UI 미리보기 · 모든 인원과 출석 상태는 예시입니다. 서버에 연결하지 않으며 실제 출석은 처리되지 않습니다.</p>
        <div className={styles.sessionScroller}>
          <section className={styles.sessionGroup}>
            <h2>예정·진행중인 출석체크</h2>
            {EXAMPLES.filter((session) => session.status !== "ENDED").map(renderSession)}
          </section>
          <button className={styles.addButton} onClick={() => setSelectedId(null)}>출석체크 만들기 +</button>
          <section className={styles.sessionGroup}>
            <h2 className={styles.closedHeading}>종료된 출석체크</h2>
            {EXAMPLES.filter((session) => session.status === "ENDED").map(renderSession)}
          </section>
        </div>
      </section>
      <section className={styles.detailPanel} aria-label="회원 출석 현황">
        {selected ? <>
          <header className={styles.detailHeader}>
            <div><h2>{selected.title}</h2><p>미리보기 · {dateLabel(selected.date)}</p><p>실제 출석 기록이 아닙니다.</p></div>
            <div className={styles.detailActions}>
              <button className={styles.closeButton} disabled title="미리보기에서는 서버 데이터를 변경하지 않습니다.">
                {selected.status === "SCHEDULED" ? "출석 체크 시작" : selected.status === "ONGOING" ? "출석 체크 종료" : "수정"}
              </button>
              {selected.status === "ENDED" && <button className={styles.deleteButton} disabled>삭제</button>}
            </div>
          </header>
          <div className={styles.summary}><span>예시 출석 : <strong>01명</strong></span><span>지각 : <strong>미지원</strong></span><span>예시 미출석 : <strong>02명</strong></span></div>
          <PreviewQr key={selected.id} ongoing={selected.status === "ONGOING"} />
          <div className={styles.searchRow}><input aria-label="이름 검색" value={searchName} onChange={(event) => setSearchName(event.target.value)} placeholder="이름 검색" /><span>{visible.length}명</span></div>
          <div className={styles.tableScroll}><table className={styles.table}>
            <thead><tr>
              {[["name", "이름"], ["role", "회원 구분"], ["status", "출석 상태"]].map(([key, label]) =>
                <th key={key}><button onClick={() => changeSort(key)}>{label} {sortBy === key ? direction > 0 ? "▲" : "▼" : "↕"}</button></th>)}
              <th>비고</th>
            </tr></thead>
            <tbody>{visible.map((member) => <tr key={member.id}>
              <td>{member.name}</td><td>{member.level}</td>
              <td><div className={styles.statusButtons}>
                <button disabled className={member.status === "PRESENT" ? styles.presentActive : ""}>출석</button>
                <button disabled>지각</button>
                <button disabled className={member.status === "ABSENT" ? styles.absentActive : ""}>미출석</button>
              </div></td>
              <td><input className={styles.noteInput} aria-label={`${member.name} 비고`} value={member.note} readOnly /></td>
            </tr>)}
              {!visible.length && <tr><td colSpan="4" className={styles.emptyRow}>필터 결과가 없습니다.</td></tr>}
            </tbody>
          </table></div>
        </> : <>
          <header className={styles.detailHeader}><div><h2>ADD ATTENDANCE</h2><p>출석체크 만들기 · 미리보기</p></div></header>
          <form className={`${styles.createForm} ${styles.createPanelForm}`} onSubmit={(event) => event.preventDefault()}>
            <label>출석체크 명<input value="예시 신규 모임" readOnly /></label>
            <label>출석체크 기간<input type="date" value="2026-11-14" readOnly /></label>
            <label>출석체크 마감시간<input type="time" disabled /></label>
            <p className={styles.autoDateNote}>입력 화면 확인용입니다. 출석 생성·저장·변경은 사용할 수 없습니다.</p>
            <button className={styles.createSubmit} type="submit" disabled>출석체크 생성하기 (미리보기)</button>
          </form>
        </>}
      </section>
    </main>
  );
}
