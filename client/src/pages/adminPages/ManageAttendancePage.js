import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../../assets/Admin/ManageAttendance.module.css";
import { adminAttendanceApi, adminPermissonApi } from "../../api/admin";
import {
  attendanceCounts,
  compareAttendanceRoles,
  attendanceRoleLabel,
  createAttendanceSession,
  readAttendanceSessions,
  writeAttendanceSessions,
} from "../../utils/attendanceStorage";

const EMPTY_RECORDS = [];
const ATTENDANCE_STATUS_ORDER = { PRESENT: 0, LATE: 1, ABSENT: 2 };

const dateInputValue = (date = new Date()) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");

const dateLabel = (date) => {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(parsed);
};

const dateTimeLabel = (dateTime) => {
  if (!dateTime) return "기록 없음";
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) return "기록 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
};

const fetchAllMembers = async () => {
  const pageSize = 100;
  const members = [];
  let page = 0;
  let hasNext = true;
  while (hasNext) {
    const response = await adminPermissonApi.getUserRoleList(page, pageSize);
    members.push(...(response.content || []));
    hasNext = Boolean(response.hasNext);
    page += 1;
  }
  return members;
};

const ManageAttendancePage = () => {
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => dateInputValue());
  const [deadlineTime, setDeadlineTime] = useState("");
  const [editingClosed, setEditingClosed] = useState(false);
  const [draftMembers, setDraftMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [sortDirection, setSortDirection] = useState(1);
  const [error, setError] = useState("");

  const selectedSession = sessions.find((session) => session.id === selectedSessionId);
  const records = useMemo(() => selectedSession?.members || EMPTY_RECORDS, [selectedSession]);
  const visibleSourceMembers = editingClosed && draftMembers ? draftMembers : records;
  const [sortBy, setSortBy] = useState("role");

  const refreshSessions = useCallback((preferredId, updatedSessions) => {
    const next = updatedSessions || readAttendanceSessions();
    if (updatedSessions && !writeAttendanceSessions(next)) {
      setError("브라우저 저장 공간에 출석 데이터를 저장하지 못했습니다.");
    }
    setSessions(next);
    const id = preferredId ?? selectedSessionId;
    setSelectedSessionId(
      id && next.some((session) => session.id === id)
        ? id
        : next.find((session) => session.status === "OPEN")?.id ?? next[0]?.id ?? null,
    );
  }, [selectedSessionId]);

  useEffect(() => {
    let active = true;
    const stored = readAttendanceSessions();
    setSessions(stored);
    setSelectedSessionId(stored.find((session) => session.status === "OPEN")?.id ?? null);

    fetchAllMembers()
      .then((loadedMembers) => {
        if (!active) return;
        setMembers(loadedMembers);
        const memberById = new Map(loadedMembers.map((member) => [String(member.id), member]));
        const current = readAttendanceSessions();
        const refreshed = current.map((session) => ({
          ...session,
          members: [
            ...session.members.map((record) => {
              const member = memberById.get(String(record.userId));
              return member ? { ...record, name: member.name, role: member.role } : record;
            }),
            ...(session.status === "OPEN"
              ? loadedMembers
                  .filter((member) => !session.members.some((record) => String(record.userId) === String(member.id)))
                  .map((member) => ({ userId: member.id, name: member.name, role: member.role, status: "ABSENT", note: "" }))
              : []),
          ],
        }));
        writeAttendanceSessions(refreshed);
        setSessions(refreshed);
      })
      .catch(() => {
        if (active) setError("회원 목록을 불러오지 못했습니다. 출석 체크를 만들려면 회원 목록이 필요합니다.");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    adminAttendanceApi.getEvents()
      .then((response) => { if (active) setEvents(Array.isArray(response) ? response : []); })
      .catch(() => { if (active) setError("행사 일정을 불러오지 못했습니다. 행사명과 날짜를 직접 입력해 출석 체크를 만들 수 있습니다."); });
    return () => { active = false; };
  }, []);

  const visibleRecords = useMemo(() => visibleSourceMembers
    .filter((record) => String(record.name || "").toLocaleLowerCase("ko").includes(searchName.trim().toLocaleLowerCase("ko")))
    .slice()
    .sort((a, b) => {
      if (sortBy === "role") {
        return compareAttendanceRoles(a.role, b.role) * sortDirection || String(a.name || "").localeCompare(String(b.name || ""), "ko");
      }
      if (sortBy === "status") {
        return ((ATTENDANCE_STATUS_ORDER[a.status] ?? Number.MAX_SAFE_INTEGER) - (ATTENDANCE_STATUS_ORDER[b.status] ?? Number.MAX_SAFE_INTEGER)) * sortDirection
          || String(a.name || "").localeCompare(String(b.name || ""), "ko");
      }
      return String(a.name || "").localeCompare(String(b.name || ""), "ko") * sortDirection;
    }), [visibleSourceMembers, sortBy, sortDirection, searchName]);

  const changeSort = (column) => {
    if (sortBy === column) setSortDirection((direction) => direction * -1);
    else { setSortBy(column); setSortDirection(1); }
  };

  const handleCreate = (event) => {
    event.preventDefault();
    if (!title.trim() || !eventDate || !deadlineTime || saving) return;
    if (!members.length) {
      setError("회원 목록을 불러온 뒤 출석 체크를 만들 수 있습니다.");
      return;
    }
    setSaving(true);
    setError("");
    const created = createAttendanceSession(title, eventDate, deadlineTime, members);
    const current = readAttendanceSessions();
    refreshSessions(created.id, [created, ...current]);
    setTitle("");
    setEventDate(dateInputValue());
    setDeadlineTime("");
    setEditingClosed(false);
    setDraftMembers(null);
    setSaving(false);
  };

  const selectEvent = (event) => {
    setTitle(event.title || "");
    const rawDate = event.date || "";
    if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) setEventDate(rawDate.slice(0, 10));
  };

  const openCreatePanel = () => {
    setSelectedSessionId(null);
    setEditingClosed(false);
    setDraftMembers(null);
    window.setTimeout(() => document.getElementById("attendance-title")?.focus(), 0);
  };

  const updateRecord = (record, patch) => {
    if (!selectedSession) return;
    if (selectedSession.status === "CLOSED") {
      if (!editingClosed) return;
      setDraftMembers((current) => (current || selectedSession.members).map((member) =>
        member.userId !== record.userId ? member : { ...member, ...patch },
      ));
      return;
    }
    const next = sessions.map((session) => session.id !== selectedSession.id ? session : {
      ...session,
      members: session.members.map((member) => member.userId !== record.userId ? member : { ...member, ...patch }),
    });
    refreshSessions(selectedSession.id, next);
    setError("");
  };

  const closeSession = () => {
    if (!selectedSession || selectedSession.status !== "OPEN" || saving) return;
    if (!window.confirm(`'${selectedSession.title}' 출석 체크를 종료할까요? 종료 후에도 출석 결과를 수정하거나 삭제할 수 있습니다.`)) return;
    const endedAt = new Date().toISOString();
    refreshSessions(selectedSession.id, sessions.map((session) => session.id === selectedSession.id ? { ...session, status: "CLOSED", endedAt } : session));
  };

  const saveClosedEdits = () => {
    if (!selectedSession || selectedSession.status !== "CLOSED" || !draftMembers) return;
    const next = sessions.map((session) => session.id === selectedSession.id
      ? { ...session, members: draftMembers }
      : session,
    );
    refreshSessions(selectedSession.id, next);
    setEditingClosed(false);
    setDraftMembers(null);
  };

  const cancelClosedEdits = () => {
    setEditingClosed(false);
    setDraftMembers(null);
  };

  const deleteClosedSession = () => {
    if (!selectedSession || selectedSession.status !== "CLOSED") return;
    if (!window.confirm(`'${selectedSession.title}' 출석 결과를 삭제할까요? 삭제 후 복구할 수 없습니다.`)) return;
    const next = sessions.filter((session) => session.id !== selectedSession.id);
    refreshSessions(null, next);
    setEditingClosed(false);
    setDraftMembers(null);
  };

  const activeSessions = sessions.filter((session) => session.status === "OPEN");
  const closedSessions = sessions.filter((session) => session.status === "CLOSED");

  const renderSession = (session, closed = false) => {
    const counts = attendanceCounts(session);
    return (
      <button key={session.id} className={`${styles.sessionCard} ${closed ? styles.closedCard : ""} ${selectedSessionId === session.id ? styles.selected : ""}`} onClick={() => { setSelectedSessionId(session.id); setEditingClosed(false); setDraftMembers(null); }}>
        <span className={styles.sessionTop}><span className={styles.statusDot} /><span className={styles.sessionName}>{session.title}</span><span className={styles.sessionDate}>{dateLabel(session.eventDate)}{session.deadlineTime ? ` · 마감 ${session.deadlineTime}` : ""}</span><span className={closed ? styles.resultTag : styles.manageTag}>{closed ? "출석 결과" : "출석 관리"}</span></span>
        <span className={styles.sessionCounts}>{closed ? "종료" : "시작"} : {dateTimeLabel(closed ? session.endedAt : session.createdAt)}</span>
        <span className={styles.sessionCounts}>출석 : {counts.presentCount}명 <span>지각 : {counts.lateCount}명</span><span>미출석 : {counts.absentCount}명</span></span>
      </button>
    );
  };

  return (
    <main className={styles.page}>
      <section className={styles.listPanel} aria-label="출석 체크 목록">
        <header className={styles.panelHeader}>
          <div><h1>ATTENDANCE CHECK</h1><p>출석 체크 생성 &amp; 출석 현황 확인</p></div>
          <button className={styles.mobileAdd} onClick={openCreatePanel} aria-label="출석 체크 만들기">＋</button>
        </header>
        {error && <div className={styles.error} role="alert">{error}</div>}
        <div className={styles.sessionScroller}>
          <section className={styles.sessionGroup}>
            <h2>진행중인 출석체크</h2>
            {loading ? <div className={styles.empty}>회원 목록을 불러오는 중입니다.</div> : activeSessions.length ? activeSessions.map((session) => renderSession(session)) : <div className={styles.empty}>진행 중인 출석 체크가 없습니다.</div>}
          </section>
          <button className={styles.addButton} onClick={openCreatePanel}>출석체크 만들기 +</button>
          <section className={styles.sessionGroup}>
            <h2 className={styles.closedHeading}>종료된 출석체크</h2>
            {closedSessions.length ? closedSessions.map((session) => renderSession(session, true)) : <div className={styles.empty}>종료된 출석 체크가 없습니다.</div>}
          </section>
        </div>
      </section>

      <section className={styles.detailPanel} aria-label="회원 출석 현황">
        {selectedSession ? <>
          <header className={styles.detailHeader}><div><h2>{selectedSession.status === "CLOSED" ? "CLOSED ATTENDANCE" : selectedSession.title}</h2><p>{selectedSession.status === "OPEN" ? "출석관리" : "종료된 출석체크"} · {dateLabel(selectedSession.eventDate)}{selectedSession.deadlineTime ? ` · 마감 ${selectedSession.deadlineTime}` : ""}</p><p>시작: {dateTimeLabel(selectedSession.createdAt)}</p>{selectedSession.endedAt && <p>종료: {dateTimeLabel(selectedSession.endedAt)}</p>}</div>
            <div className={styles.detailActions}>
              {selectedSession.status === "OPEN" && <button className={styles.closeButton} onClick={closeSession} disabled={saving}>출석 체크 종료</button>}
              {selectedSession.status === "CLOSED" && (editingClosed ? <>
                <button className={styles.saveButton} onClick={saveClosedEdits}>수정내용 저장</button>
                <button className={styles.closeButton} onClick={cancelClosedEdits}>취소</button>
              </> : <button className={styles.closeButton} onClick={() => { setDraftMembers(selectedSession.members); setEditingClosed(true); }}>수정</button>)}
              {selectedSession.status === "CLOSED" && <button className={styles.deleteButton} onClick={deleteClosedSession}>삭제</button>}
            </div>
          </header>
          <div className={styles.summary}><span>출석 : <strong>{attendanceCounts({ ...selectedSession, members: visibleSourceMembers }).presentCount.toString().padStart(2, "0")}명</strong></span><span>지각 : <strong>{attendanceCounts({ ...selectedSession, members: visibleSourceMembers }).lateCount.toString().padStart(2, "0")}명</strong></span><span>미출석 : <strong>{attendanceCounts({ ...selectedSession, members: visibleSourceMembers }).absentCount.toString().padStart(2, "0")}명</strong></span></div>
          <div className={styles.searchRow}><input aria-label="이름 검색" value={searchName} onChange={(event) => setSearchName(event.target.value)} placeholder="이름 검색" /><span>{visibleRecords.length}명</span></div>
          <div className={styles.tableScroll}><table className={styles.table}><thead><tr>
            <th><button onClick={() => changeSort("name")}>이름 {sortBy === "name" ? (sortDirection > 0 ? "▲" : "▼") : "↕"}</button></th>
            <th aria-sort={sortBy === "role" ? (sortDirection > 0 ? "ascending" : "descending") : "none"}><button onClick={() => changeSort("role")}>회원 구분 {sortBy === "role" ? (sortDirection > 0 ? "▲" : "▼") : "↕"}</button></th>
            <th aria-sort={sortBy === "status" ? (sortDirection > 0 ? "ascending" : "descending") : "none"}><button onClick={() => changeSort("status")}>출석 상태 {sortBy === "status" ? (sortDirection > 0 ? "▲" : "▼") : "↕"}</button></th>
            <th>비고</th>
          </tr></thead><tbody>
            {visibleRecords.map((record) => <tr key={record.userId}>
              <td>{record.name}</td><td>{attendanceRoleLabel(record.role)}</td>
              <td><div className={styles.statusButtons}>
                <button disabled={selectedSession.status !== "OPEN" && !editingClosed} className={record.status === "PRESENT" ? styles.presentActive : ""} onClick={() => updateRecord(record, { status: "PRESENT" })}>출석</button>
                <button disabled={selectedSession.status !== "OPEN" && !editingClosed} className={record.status === "LATE" ? styles.lateActive : ""} onClick={() => updateRecord(record, { status: "LATE" })}>지각</button>
                <button disabled={selectedSession.status !== "OPEN" && !editingClosed} className={record.status === "ABSENT" ? styles.absentActive : ""} onClick={() => updateRecord(record, { status: "ABSENT" })}>미출석</button>
              </div></td>
              <td><input className={styles.noteInput} aria-label={`${record.name} 비고`} disabled={selectedSession.status !== "OPEN" && !editingClosed} value={record.note || ""} maxLength="500" placeholder="비고 입력" onChange={(event) => updateRecord(record, { note: event.target.value })} /></td>
            </tr>)}
            {!visibleRecords.length && <tr><td colSpan="4" className={styles.emptyRow}>{records.length ? "필터 결과가 없습니다." : "등록된 회원이 없습니다."}</td></tr>}
          </tbody></table></div>
        </> : <>
          <header className={styles.detailHeader}><div><h2>ADD ATTENDANCE</h2><p>출석체크 만들기</p></div></header>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <form className={`${styles.createForm} ${styles.createPanelForm}`} onSubmit={handleCreate}>
            {events.length > 0 && <label>행사 일정<select className={styles.eventSelect} defaultValue="" onChange={(event) => { const selected = events[Number(event.target.value)]; if (selected) selectEvent(selected); }}><option value="">일정을 선택하거나 직접 입력</option>{events.map((item, index) => <option key={`${item.title}-${index}`} value={index}>{item.title} · {item.date}</option>)}</select></label>}
            <label>출석체크 명<input id="attendance-title" required maxLength="255" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예) 시작발표" /></label>
            <label>출석체크 기간<input required type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label>
            <label>출석체크 마감시간<input required type="time" value={deadlineTime} onChange={(event) => setDeadlineTime(event.target.value)} /></label>
            <p className={styles.autoDateNote}>실제 생성·종료 시각은 자동으로 기록됩니다.</p>
            <button className={styles.createSubmit} type="submit" disabled={saving || loading}>{saving ? "생성 중…" : "출석체크 생성하기"}</button>
          </form>
        </>}
      </section>
    </main>
  );
};

export default ManageAttendancePage;
