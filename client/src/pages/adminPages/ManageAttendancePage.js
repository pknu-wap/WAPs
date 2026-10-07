import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../../assets/Admin/ManageAttendance.module.css";
import { adminAttendanceApi, adminPermissonApi } from "../../api/admin";
import {
  attendanceCounts,
  attendanceRoleLabel,
  createAttendanceSession,
  readAttendanceSessions,
  writeAttendanceSessions,
} from "../../utils/attendanceStorage";

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
  const [eventDate, setEventDate] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortDirection, setSortDirection] = useState(1);
  const [error, setError] = useState("");

  const selectedSession = sessions.find((session) => session.id === selectedSessionId);
  const records = useMemo(() => selectedSession?.members || [], [selectedSession]);
  const [sortBy, setSortBy] = useState("name");

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
    setSelectedSessionId(stored.find((session) => session.status === "OPEN")?.id ?? stored[0]?.id ?? null);

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

  const visibleRecords = useMemo(() => records
    .filter((record) => filterRole === "ALL" || record.role === filterRole)
    .filter((record) => filterStatus === "ALL" || record.status === filterStatus)
    .slice()
    .sort((a, b) => {
      const first = sortBy === "role" ? attendanceRoleLabel(a.role) : sortBy === "status" ? a.status : a.name;
      const second = sortBy === "role" ? attendanceRoleLabel(b.role) : sortBy === "status" ? b.status : b.name;
      return String(first).localeCompare(String(second), "ko") * sortDirection;
    }), [records, filterRole, filterStatus, sortBy, sortDirection]);

  const visibleDirectory = useMemo(() => members
    .filter((member) => filterRole === "ALL" || member.role === filterRole)
    .slice()
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ko") * sortDirection),
  [members, filterRole, sortDirection]);

  const changeSort = () => {
    if (sortBy === "name") setSortDirection((direction) => direction * -1);
    else { setSortBy("name"); setSortDirection(1); }
  };

  const handleCreate = (event) => {
    event.preventDefault();
    if (!title.trim() || !eventDate || saving) return;
    if (!members.length) {
      setError("회원 목록을 불러온 뒤 출석 체크를 만들 수 있습니다.");
      return;
    }
    setSaving(true);
    setError("");
    const created = createAttendanceSession(title, eventDate, members);
    const current = readAttendanceSessions();
    refreshSessions(created.id, [created, ...current]);
    setTitle("");
    setEventDate("");
    setShowCreate(false);
    setSaving(false);
  };

  const selectEvent = (event) => {
    setTitle(event.title || "");
    const rawDate = event.date || "";
    setEventDate(/^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : "");
  };

  const updateRecord = (record, patch) => {
    if (!selectedSession || selectedSession.status !== "OPEN") return;
    const next = sessions.map((session) => session.id !== selectedSession.id ? session : {
      ...session,
      members: session.members.map((member) => member.userId !== record.userId ? member : { ...member, ...patch }),
    });
    refreshSessions(selectedSession.id, next);
    setError("");
  };

  const closeSession = () => {
    if (!selectedSession || selectedSession.status !== "OPEN" || saving) return;
    if (!window.confirm(`'${selectedSession.title}' 출석 체크를 종료할까요? 종료 후에는 수정할 수 없습니다.`)) return;
    refreshSessions(selectedSession.id, sessions.map((session) => session.id === selectedSession.id ? { ...session, status: "CLOSED" } : session));
  };

  const activeSessions = sessions.filter((session) => session.status === "OPEN");
  const closedSessions = sessions.filter((session) => session.status === "CLOSED");

  const renderSession = (session, closed = false) => {
    const counts = attendanceCounts(session);
    return (
      <button key={session.id} className={`${styles.sessionCard} ${closed ? styles.closedCard : ""} ${selectedSessionId === session.id ? styles.selected : ""}`} onClick={() => { setSelectedSessionId(session.id); setShowCreate(false); }}>
        <span className={styles.sessionTop}><span className={styles.statusDot} /><span className={styles.sessionName}>{session.title}</span><span className={styles.sessionDate}>{dateLabel(session.eventDate)}</span><span className={closed ? styles.resultTag : styles.manageTag}>{closed ? "출석 결과" : "출석 관리"}</span></span>
        <span className={styles.sessionCounts}>출석 : {counts.presentCount}명 <span>미출석 : {counts.absentCount}명</span></span>
      </button>
    );
  };

  return (
    <main className={styles.page}>
      <section className={styles.listPanel} aria-label="출석 체크 목록">
        <header className={styles.panelHeader}>
          <div><h1>ATTENDANCE CHECK</h1><p>출석 체크 생성 &amp; 출석 현황 확인</p></div>
          <button className={styles.mobileAdd} onClick={() => setShowCreate((open) => !open)} aria-label="출석 체크 만들기">＋</button>
        </header>
        {error && <div className={styles.error} role="alert">{error}</div>}
        <div className={styles.sessionScroller}>
          <section className={styles.sessionGroup}>
            <h2>진행중인 출석체크</h2>
            {loading ? <div className={styles.empty}>회원 목록을 불러오는 중입니다.</div> : activeSessions.length ? activeSessions.map((session) => renderSession(session)) : <div className={styles.empty}>진행 중인 출석 체크가 없습니다.</div>}
          </section>
          <button className={styles.addButton} onClick={() => setShowCreate((open) => !open)}>{showCreate ? "출석 체크 만들기 닫기 −" : "출석체크 만들기 +"}</button>
          {showCreate && <form className={styles.createForm} onSubmit={handleCreate}>
            <h2>출석 체크 만들기</h2>
            {events.length > 0 && <label>행사 일정<select className={styles.eventSelect} defaultValue="" onChange={(event) => { const selected = events[Number(event.target.value)]; if (selected) selectEvent(selected); }}><option value="">일정을 선택하거나 직접 입력</option>{events.map((item, index) => <option key={`${item.title}-${index}`} value={index}>{item.title} · {item.date}</option>)}</select></label>}
            <label>출석체크 명<input required maxLength="255" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예) 시작발표" /></label>
            <label>출석체크 날짜<input required type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label>
            <button className={styles.createSubmit} type="submit" disabled={saving || loading}>{saving ? "생성 중…" : "출석체크 생성하기"}</button>
          </form>}
          <section className={styles.sessionGroup}>
            <h2 className={styles.closedHeading}>종료된 출석체크</h2>
            {closedSessions.length ? closedSessions.map((session) => renderSession(session, true)) : <div className={styles.empty}>종료된 출석 체크가 없습니다.</div>}
          </section>
        </div>
        <p className={styles.storageNote}>이 브라우저에 출석 정보가 저장됩니다.</p>
      </section>

      <section className={styles.detailPanel} aria-label="회원 출석 현황">
        {selectedSession ? <>
          <header className={styles.detailHeader}><div><h2>{selectedSession.title}</h2><p>{selectedSession.status === "OPEN" ? "출석관리" : "출석 결과"} · {dateLabel(selectedSession.eventDate)}</p></div>
            {selectedSession.status === "OPEN" && <button className={styles.closeButton} onClick={closeSession} disabled={saving}>출석 체크 종료</button>}
          </header>
          <div className={styles.summary}><span>출석 : <strong>{attendanceCounts(selectedSession).presentCount.toString().padStart(2, "0")}명</strong></span><span>미출석 : <strong>{attendanceCounts(selectedSession).absentCount.toString().padStart(2, "0")}명</strong></span></div>
          <div className={styles.tableScroll}><table className={styles.table}><thead><tr>
            <th><button onClick={changeSort}>이름 {sortBy === "name" ? (sortDirection > 0 ? "▲" : "▼") : "↕"}</button></th>
            <th><select aria-label="회원 구분 필터" value={filterRole} onChange={(event) => setFilterRole(event.target.value)}><option value="ALL">회원 구분 전체</option><option value="ROLE_ADMIN">임원진</option><option value="ROLE_MEMBER">정회원</option><option value="ROLE_USER">준회원</option><option value="ROLE_GUEST">신입</option></select></th>
            <th><select aria-label="출석 상태 필터" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}><option value="ALL">출석 상태 전체</option><option value="PRESENT">출석</option><option value="ABSENT">미출석</option></select></th>
            <th>비고</th>
          </tr></thead><tbody>
            {visibleRecords.map((record) => <tr key={record.userId}>
              <td>{record.name}</td><td>{attendanceRoleLabel(record.role)}</td>
              <td><div className={styles.statusButtons}>
                <button disabled={selectedSession.status !== "OPEN"} className={record.status === "PRESENT" ? styles.presentActive : ""} onClick={() => updateRecord(record, { status: "PRESENT" })}>출석</button>
                <button disabled={selectedSession.status !== "OPEN"} className={record.status === "ABSENT" ? styles.absentActive : ""} onClick={() => updateRecord(record, { status: "ABSENT" })}>미출석</button>
              </div></td>
              <td><input className={styles.noteInput} aria-label={`${record.name} 비고`} disabled={selectedSession.status !== "OPEN"} value={record.note || ""} maxLength="500" placeholder="비고 입력" onChange={(event) => updateRecord(record, { note: event.target.value })} /></td>
            </tr>)}
            {!visibleRecords.length && <tr><td colSpan="4" className={styles.emptyRow}>{records.length ? "필터 결과가 없습니다." : "등록된 회원이 없습니다."}</td></tr>}
          </tbody></table></div>
        </> : <>
          <header className={styles.detailHeader}><div><h2>회원 명단</h2><p>전체 회원 {members.length}명</p></div></header>
          <div className={styles.summary}><span>출석체크를 만들면 회차별 출석 상태를 관리할 수 있습니다.</span></div>
          <div className={styles.tableScroll}><table className={styles.table}><thead><tr>
            <th><button onClick={changeSort}>이름 {sortDirection > 0 ? "▲" : "▼"}</button></th>
            <th><select aria-label="회원 구분 필터" value={filterRole} onChange={(event) => setFilterRole(event.target.value)}><option value="ALL">회원 구분 전체</option><option value="ROLE_ADMIN">임원진</option><option value="ROLE_MEMBER">정회원</option><option value="ROLE_USER">준회원</option><option value="ROLE_GUEST">신입</option></select></th>
            <th>출석 상태</th><th>비고</th>
          </tr></thead><tbody>
            {loading ? <tr><td colSpan="4" className={styles.emptyRow}>회원 명단을 불러오는 중입니다.</td></tr> : visibleDirectory.map((member) => <tr key={member.id}>
              <td>{member.name}</td><td>{attendanceRoleLabel(member.role)}</td><td className={styles.directoryHint}>회차 선택 후 표시</td><td>—</td>
            </tr>)}
            {!loading && !visibleDirectory.length && <tr><td colSpan="4" className={styles.emptyRow}>{error || "표시할 회원이 없습니다."}</td></tr>}
          </tbody></table></div>
        </>}
      </section>
    </main>
  );
};

export default ManageAttendancePage;
