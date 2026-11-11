import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../../assets/Admin/ManageAttendance.module.css";
import AttendanceQr from "../../components/Admin/AttendanceQr";
import { adminAttendanceApi } from "../../api/admin";

const EMPTY_RECORDS = [];
const ATTENDANCE_STATUS_ORDER = { PRESENT: 0, ABSENT: 1 };
const MEMBERSHIP_ORDER = { NEW: 0, ASSOCIATE: 1, REGULAR: 2, NONE: 3 };
const attendanceRoleLabel = (level) =>
  ({ NEW: "신입", ASSOCIATE: "준회원", REGULAR: "정회원", NONE: "없음" })[
    level
  ] || level;
const inputDateFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const displayDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});
const dateInputValue = () => inputDateFormatter.format(new Date());
const dateLabel = (date) =>
  date ? displayDateFormatter.format(new Date(`${date}T00:00:00+09:00`)) : "";
const UNAVAILABLE_TIME_LABEL = "서버 미제공";
const attendanceCounts = (session) =>
  session.members
    ? {
        presentCount: session.members.filter(
          (member) => member.status === "PRESENT",
        ).length,
        absentCount: session.members.filter(
          (member) => member.status === "ABSENT",
        ).length,
      }
    : session;
const toSession = (response) => ({
  ...response,
  id: response.attendanceId,
  eventDate: response.date,
  ...(response.participants
    ? {
        members: response.participants.content.map((participant) => ({
          ...participant,
          name: participant.userName,
          role: participant.membershipLevel,
        })),
      }
    : {}),
});
const requestError = (error) => {
  switch (error.response?.status) {
    case 400:
      return "입력값을 확인해 주세요. 제목은 1~100자, 날짜는 한국 시간 기준 오늘 이후여야 합니다.";
    case 401:
      return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    case 403:
      return "출석 관리에는 관리자 권한이 필요합니다.";
    case 404:
      return "해당 출석체크 또는 대상자가 서버에 없습니다. 목록을 새로고침해 주세요.";
    case 409:
      return "서버 출석 상태가 변경되었습니다. 새로고침 후 다시 시도해 주세요.";
    default:
      return "서버 요청에 실패했습니다. 연결을 확인하고 다시 시도해 주세요.";
  }
};

function AttendanceSessionHeading({ session }) {
  return (
    <div>
      <h2>
        {session.status === "ENDED" ? "CLOSED ATTENDANCE" : session.title}
      </h2>
      <p>
        {session.status === "ONGOING"
          ? "출석관리"
          : session.status === "SCHEDULED"
            ? "예정된 출석체크"
            : "종료된 출석체크"}{" "}
        · {dateLabel(session.eventDate)}
        {session.deadlineTime ? ` · 마감 ${session.deadlineTime}` : ""}
      </p>
      <p>시작: {UNAVAILABLE_TIME_LABEL}</p>
      {session.endedAt && <p>종료: {UNAVAILABLE_TIME_LABEL}</p>}
    </div>
  );
}

const ManageAttendancePage = () => {
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [title, setTitle] = useState("");
  const today = dateInputValue();
  const [eventDate, setEventDate] = useState(dateInputValue);
  const [editingClosed, setEditingClosed] = useState(false);
  const [draftMembers, setDraftMembers] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [sortDirection, setSortDirection] = useState(1);
  const [sortBy, setSortBy] = useState("role");
  const [error, setError] = useState("");
  const mutationPending = useRef(false);
  const mounted = useRef(false);
  const selectedId = useRef(null);
  selectedId.current = selectedSessionId;

  const selectedSession = detail?.id === selectedSessionId ? detail : null;
  const records = selectedSession?.members || EMPTY_RECORDS;
  const visibleSourceMembers =
    editingClosed && draftMembers ? draftMembers : records;

  const loadList = useCallback(async () => {
    const response = await adminAttendanceApi.getList();
    const next = response.content.map(toSession);
    if (mounted.current) setSessions(next);
    return next;
  }, []);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    loadList()
      .then((next) => {
        if (active && selectedId.current === null)
          setSelectedSessionId(
            next.find((session) => session.status === "ONGOING")?.id ??
              next[0]?.id ??
              null,
          );
      })
      .catch((error) => {
        if (active) setError(requestError(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    adminAttendanceApi
      .getEvents()
      .then((response) => {
        if (active) setEvents(Array.isArray(response) ? response : []);
      })
      .catch(() => {
        if (active)
          setError(
            "행사 일정을 불러오지 못했습니다. 행사명과 날짜는 직접 입력할 수 있습니다.",
          );
      });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [loadList]);

  useEffect(() => {
    let active = true;
    setDetail(null);
    if (selectedSessionId === null) {
      setDetailLoading(false);
      return undefined;
    }
    setDetailLoading(true);
    adminAttendanceApi
      .getDetail(selectedSessionId)
      .then((response) => {
        if (!active) return;
        if (response.attendanceId !== selectedSessionId)
          throw new Error("Unexpected attendance ID");
        const next = toSession(response);
        setDetail(next);
        setSessions((current) =>
          current.map((session) => (session.id === next.id ? next : session)),
        );
      })
      .catch((error) => {
        if (active) setError(requestError(error));
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedSessionId, revision]);

  const runMutation = async (operation) => {
    if (mutationPending.current) return;
    mutationPending.current = true;
    setSaving(true);
    setError("");
    try {
      await operation();
    } catch (error) {
      if (mounted.current) setError(requestError(error));
    } finally {
      mutationPending.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  const refreshList = async () => {
    try {
      await loadList();
    } catch (error) {
      if (mounted.current)
        setError(
          `변경은 저장되었지만 목록 갱신에 실패했습니다. ${requestError(error)}`,
        );
    }
  };

  const selectSession = (id) => {
    if (mutationPending.current) return;
    setSelectedSessionId(id);
    setEditingClosed(false);
    setDraftMembers(null);
    setNoteDrafts({});
    setSearchName("");
    setError("");
  };

  const visibleRecords = useMemo(
    () =>
      visibleSourceMembers
        .filter((record) =>
          String(record.name || "")
            .toLocaleLowerCase("ko")
            .includes(searchName.trim().toLocaleLowerCase("ko")),
        )
        .slice()
        .sort((a, b) => {
          const byName = String(a.name || "").localeCompare(
            String(b.name || ""),
            "ko",
          );
          if (sortBy === "role")
            return (
              ((MEMBERSHIP_ORDER[a.role] ?? 4) -
                (MEMBERSHIP_ORDER[b.role] ?? 4)) *
                sortDirection || byName
            );
          if (sortBy === "status")
            return (
              ((ATTENDANCE_STATUS_ORDER[a.status] ?? 2) -
                (ATTENDANCE_STATUS_ORDER[b.status] ?? 2)) *
                sortDirection || byName
            );
          return byName * sortDirection;
        }),
    [visibleSourceMembers, sortBy, sortDirection, searchName],
  );

  const changeSort = (column) => {
    if (sortBy === column) setSortDirection((direction) => direction * -1);
    else {
      setSortBy(column);
      setSortDirection(1);
    }
  };

  const handleCreate = (event) => {
    event.preventDefault();
    if (!title.trim() || title.trim().length > 100 || !eventDate) return;
    const submissionDate = dateInputValue();
    if (eventDate < submissionDate) {
      setError("한국 시간 기준 오늘 또는 미래 날짜를 입력해 주세요.");
      return;
    }
    runMutation(async () => {
      const created = toSession(
        await adminAttendanceApi.create({
          title: title.trim(),
          date: eventDate,
        }),
      );
      if (!mounted.current) return;
      setSessions((current) => [created, ...current]);
      setSelectedSessionId(created.id);
      setTitle("");
      setEventDate(submissionDate);
      setEditingClosed(false);
      setDraftMembers(null);
      setNoteDrafts({});
    });
  };

  const selectEvent = (event) => {
    setTitle(event.title || "");
    if (/^\d{4}-\d{2}-\d{2}/.test(event.date || ""))
      setEventDate(event.date.slice(0, 10));
  };

  const openCreatePanel = () => {
    selectSession(null);
    window.setTimeout(
      () => document.getElementById("attendance-title")?.focus(),
      0,
    );
  };

  const replaceParticipant = (participant) => {
    setDetail((current) =>
      current
        ? {
            ...current,
            members: current.members.map((member) =>
              member.userId === participant.userId
                ? {
                    ...participant,
                    name: participant.userName,
                    role: participant.membershipLevel,
                  }
                : member,
            ),
          }
        : current,
    );
  };

  const updateRecord = (record, patch) => {
    if (!selectedSession || selectedSession.status === "SCHEDULED") return;
    if (selectedSession.status === "ENDED") {
      if (!editingClosed || mutationPending.current) return;
      setDraftMembers((current) =>
        (current || records).map((member) =>
          member.userId === record.userId ? { ...member, ...patch } : member,
        ),
      );
      return;
    }
    runMutation(async () => {
      const participant = await adminAttendanceApi.updateParticipant(
        selectedSession.id,
        record.userId,
        patch,
      );
      if (!mounted.current) return;
      replaceParticipant(participant);
      if (Object.prototype.hasOwnProperty.call(patch, "note"))
        setNoteDrafts((current) => {
          const next = { ...current };
          delete next[record.userId];
          return next;
        });
      await refreshList();
    });
  };

  const changeStatus = (status) => {
    if (!selectedSession) return;
    if (
      status === "ENDED" &&
      !window.confirm(
        `'${selectedSession.title}' 출석 체크를 종료할까요? 종료 후에도 출석 결과를 수정하거나 삭제할 수 있습니다.`,
      )
    )
      return;
    runMutation(async () => {
      const summary = toSession(
        await adminAttendanceApi.changeStatus(selectedSession.id, status),
      );
      if (!mounted.current) return;
      setDetail((current) => (current ? { ...current, ...summary } : current));
      setEditingClosed(false);
      setDraftMembers(null);
      await refreshList();
    });
  };

  const saveClosedEdits = () => {
    if (!selectedSession || !draftMembers) return;
    runMutation(async () => {
      const changes = draftMembers.flatMap((draft) => {
        const original = records.find(
          (record) => record.userId === draft.userId,
        );
        const patch = {};
        if (draft.status !== original.status) patch.status = draft.status;
        if (draft.note !== original.note) patch.note = draft.note;
        return Object.keys(patch).length ? [{ draft, patch }] : [];
      });
      const results = await Promise.allSettled(
        changes.map(async ({ draft, patch }) => {
          const participant = await adminAttendanceApi.updateParticipant(
            selectedSession.id,
            draft.userId,
            patch,
          );
          if (mounted.current) {
            // Keep the saved baseline and draft in sync, including server normalization.
            replaceParticipant(participant);
            setDraftMembers((current) =>
              current?.map((member) =>
                member.userId === participant.userId
                  ? {
                      ...participant,
                      name: participant.userName,
                      role: participant.membershipLevel,
                    }
                  : member,
              ),
            );
            setSessions((current) =>
              current.map((session) =>
                session.id === selectedSession.id && session.members
                  ? {
                      ...session,
                      members: session.members.map((member) =>
                        member.userId === participant.userId
                          ? {
                              ...participant,
                              name: participant.userName,
                              role: participant.membershipLevel,
                            }
                          : member,
                      ),
                    }
                  : session,
              ),
            );
          }
          return participant;
        }),
      );
      if (!mounted.current) return;
      const failures = results.flatMap((result, index) =>
        result.status === "rejected"
          ? [{ name: changes[index].draft.name, error: result.reason }]
          : [],
      );
      if (failures.length) {
        setError(
          `${results.length - failures.length}명 저장 성공, ${failures.length}명 저장 실패 (${failures.map((failure) => failure.name).join(", ")}). 다시 저장하면 실패한 항목만 재시도합니다. ${requestError(failures[0].error)}`,
        );
        return;
      }
      setEditingClosed(false);
      setDraftMembers(null);
      await refreshList();
    });
  };

  const cancelClosedEdits = () => {
    if (mutationPending.current) return;
    setEditingClosed(false);
    setDraftMembers(null);
  };

  const deleteClosedSession = () => {
    if (!selectedSession || selectedSession.status !== "ENDED") return;
    if (
      !window.confirm(
        `'${selectedSession.title}' 출석 결과를 삭제할까요? 삭제 후 복구할 수 없습니다.`,
      )
    )
      return;
    runMutation(async () => {
      await adminAttendanceApi.remove(selectedSession.id);
      if (!mounted.current) return;
      setSessions((current) =>
        current.filter((session) => session.id !== selectedSession.id),
      );
      setSelectedSessionId(null);
      setEditingClosed(false);
      setDraftMembers(null);
      await refreshList();
    });
  };

  const refresh = () => {
    if (
      mutationPending.current ||
      loading ||
      detailLoading ||
      editingClosed ||
      Object.keys(noteDrafts).length
    )
      return;
    setLoading(true);
    setError("");
    loadList()
      .then((next) => {
        if (!mounted.current) return;
        if (
          selectedId.current !== null &&
          !next.some((session) => session.id === selectedId.current)
        )
          selectSession(null);
        setRevision((value) => value + 1);
      })
      .catch((error) => {
        if (mounted.current) setError(requestError(error));
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
  };

  const activeSessions = sessions.filter(
    (session) => session.status !== "ENDED",
  );
  const closedSessions = sessions.filter(
    (session) => session.status === "ENDED",
  );

  const renderSession = (session, closed = false) => {
    const counts = attendanceCounts(session);
    return (
      <button
        key={session.id}
        className={`${styles.sessionCard} ${closed ? styles.closedCard : ""} ${selectedSessionId === session.id ? styles.selected : ""}`}
        disabled={saving}
        onClick={() => selectSession(session.id)}
      >
        <span className={styles.sessionTop}>
          <span className={styles.statusDot} />
          <span className={styles.sessionName}>{session.title}</span>
          <span className={styles.sessionDate}>
            {dateLabel(session.eventDate)}
            {session.deadlineTime ? ` · 마감 ${session.deadlineTime}` : ""}
          </span>
          <span className={closed ? styles.resultTag : styles.manageTag}>
            {closed
              ? "출석 결과"
              : session.status === "SCHEDULED"
                ? "출석 예정"
                : "출석 관리"}
          </span>
        </span>
        <span className={styles.sessionCounts}>
          {closed ? "종료" : "시작"} : {UNAVAILABLE_TIME_LABEL}
        </span>
        <span className={styles.sessionCounts}>
          출석 : {counts.presentCount}명 <span>지각 : 미지원</span>
          <span>미출석 : {counts.absentCount}명</span>
        </span>
      </button>
    );
  };

  return (
    <main className={styles.page}>
      <section className={styles.listPanel} aria-label="출석 체크 목록">
        <header className={styles.panelHeader}>
          <div>
            <h1>ATTENDANCE CHECK</h1>
            <p>출석 체크 생성 &amp; 출석 현황 확인</p>
          </div>
          <button
            className={styles.mobileAdd}
            onClick={openCreatePanel}
            disabled={saving}
            aria-label="출석 체크 만들기"
          >
            ＋
          </button>
        </header>
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}
        <div className={styles.sessionScroller}>
          <section className={styles.sessionGroup}>
            <h2>예정·진행중인 출석체크</h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={refresh}
              disabled={
                saving ||
                loading ||
                detailLoading ||
                editingClosed ||
                Object.keys(noteDrafts).length > 0
              }
            >
              새로고침
            </button>
            {loading ? (
              <div className={styles.empty}>출석 목록을 불러오는 중입니다.</div>
            ) : activeSessions.length ? (
              activeSessions.map((session) => renderSession(session))
            ) : (
              <div className={styles.empty}>
                예정·진행 중인 출석 체크가 없습니다.
              </div>
            )}
          </section>
          <button
            className={styles.addButton}
            onClick={openCreatePanel}
            disabled={saving}
          >
            출석체크 만들기 +
          </button>
          <section className={styles.sessionGroup}>
            <h2 className={styles.closedHeading}>종료된 출석체크</h2>
            {closedSessions.length ? (
              closedSessions.map((session) => renderSession(session, true))
            ) : (
              <div className={styles.empty}>종료된 출석 체크가 없습니다.</div>
            )}
          </section>
        </div>
      </section>

      <section className={styles.detailPanel} aria-label="회원 출석 현황">
        {detailLoading ? (
          <div className={styles.empty}>출석 상세를 불러오는 중입니다.</div>
        ) : selectedSession ? (
          <>
            <header className={styles.detailHeader}>
              <AttendanceSessionHeading session={selectedSession} />
              <div className={styles.detailActions}>
                {selectedSession.status === "SCHEDULED" && (
                  <button
                    className={styles.closeButton}
                    onClick={() => changeStatus("ONGOING")}
                    disabled={saving}
                  >
                    출석 체크 시작
                  </button>
                )}
                {selectedSession.status === "ONGOING" && (
                  <button
                    className={styles.closeButton}
                    onClick={() => changeStatus("ENDED")}
                    disabled={saving}
                  >
                    출석 체크 종료
                  </button>
                )}
                {selectedSession.status === "ENDED" &&
                  (editingClosed ? (
                    <>
                      <button
                        className={styles.saveButton}
                        disabled={saving}
                        onClick={saveClosedEdits}
                      >
                        수정내용 저장
                      </button>
                      <button
                        className={styles.closeButton}
                        disabled={saving}
                        onClick={cancelClosedEdits}
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.closeButton}
                      disabled={saving}
                      onClick={() => {
                        setDraftMembers(selectedSession.members);
                        setEditingClosed(true);
                      }}
                    >
                      수정
                    </button>
                  ))}
                {selectedSession.status === "ENDED" && (
                  <button
                    className={styles.deleteButton}
                    disabled={saving}
                    onClick={deleteClosedSession}
                  >
                    삭제
                  </button>
                )}
              </div>
            </header>
            <div className={styles.summary}>
              <span>
                출석 :{" "}
                <strong>
                  {attendanceCounts({
                    ...selectedSession,
                    members: visibleSourceMembers,
                  })
                    .presentCount.toString()
                    .padStart(2, "0")}
                  명
                </strong>
              </span>
              <span>
                지각 : <strong>미지원</strong>
              </span>
              <span>
                미출석 :{" "}
                <strong>
                  {attendanceCounts({
                    ...selectedSession,
                    members: visibleSourceMembers,
                  })
                    .absentCount.toString()
                    .padStart(2, "0")}
                  명
                </strong>
              </span>
            </div>
            <AttendanceQr
              key={`${selectedSession.id}-${selectedSession.attendanceId}-${selectedSession.status}`}
              attendanceId={selectedSession.attendanceId}
              closed={selectedSession.status !== "ONGOING"}
            />
            <div className={styles.searchRow}>
              <input
                aria-label="이름 검색"
                value={searchName}
                onChange={(event) => setSearchName(event.target.value)}
                placeholder="이름 검색"
              />
              <span>{visibleRecords.length}명</span>
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>
                      <button onClick={() => changeSort("name")}>
                        이름{" "}
                        {sortBy === "name"
                          ? sortDirection > 0
                            ? "▲"
                            : "▼"
                          : "↕"}
                      </button>
                    </th>
                    <th
                      aria-sort={
                        sortBy === "role"
                          ? sortDirection > 0
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button onClick={() => changeSort("role")}>
                        회원 구분{" "}
                        {sortBy === "role"
                          ? sortDirection > 0
                            ? "▲"
                            : "▼"
                          : "↕"}
                      </button>
                    </th>
                    <th
                      aria-sort={
                        sortBy === "status"
                          ? sortDirection > 0
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button onClick={() => changeSort("status")}>
                        출석 상태{" "}
                        {sortBy === "status"
                          ? sortDirection > 0
                            ? "▲"
                            : "▼"
                          : "↕"}
                      </button>
                    </th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRecords.map((record) => (
                    <tr key={record.userId}>
                      <td>{record.name}</td>
                      <td>{attendanceRoleLabel(record.role)}</td>
                      <td>
                        <div className={styles.statusButtons}>
                          <button
                            disabled={
                              saving ||
                              (selectedSession.status !== "ONGOING" &&
                                !editingClosed)
                            }
                            className={
                              record.status === "PRESENT"
                                ? styles.presentActive
                                : ""
                            }
                            onClick={() =>
                              updateRecord(record, { status: "PRESENT" })
                            }
                          >
                            출석
                          </button>
                          <button
                            disabled
                            title="서버에서 지각 상태를 지원하지 않습니다."
                          >
                            지각
                          </button>
                          <button
                            disabled={
                              saving ||
                              (selectedSession.status !== "ONGOING" &&
                                !editingClosed)
                            }
                            className={
                              record.status === "ABSENT"
                                ? styles.absentActive
                                : ""
                            }
                            onClick={() =>
                              updateRecord(record, { status: "ABSENT" })
                            }
                          >
                            미출석
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          className={styles.noteInput}
                          aria-label={`${record.name} 비고`}
                          disabled={
                            saving ||
                            (selectedSession.status !== "ONGOING" &&
                              !editingClosed)
                          }
                          value={
                            editingClosed
                              ? record.note || ""
                              : (noteDrafts[record.userId] ?? record.note ?? "")
                          }
                          maxLength="500"
                          placeholder="비고 입력"
                          onChange={(event) =>
                            editingClosed
                              ? updateRecord(record, {
                                  note: event.target.value,
                                })
                              : setNoteDrafts((current) => ({
                                  ...current,
                                  [record.userId]: event.target.value,
                                }))
                          }
                          onBlur={(event) => {
                            if (
                              !editingClosed &&
                              event.target.value !== (record.note || "")
                            )
                              updateRecord(record, {
                                note: event.target.value,
                              });
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  {!visibleRecords.length && (
                    <tr>
                      <td colSpan="4" className={styles.emptyRow}>
                        {records.length
                          ? "필터 결과가 없습니다."
                          : "등록된 회원이 없습니다."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : selectedSessionId !== null ? (
          <div className={styles.empty}>
            출석 상세를 불러오지 못했습니다. 목록의 새로고침으로 다시 시도해
            주세요.
          </div>
        ) : (
          <>
            <header className={styles.detailHeader}>
              <div>
                <h2>ADD ATTENDANCE</h2>
                <p>출석체크 만들기</p>
              </div>
            </header>
            {error && (
              <div className={styles.error} role="alert">
                {error}
              </div>
            )}
            <form
              className={`${styles.createForm} ${styles.createPanelForm}`}
              onSubmit={handleCreate}
            >
              {events.length > 0 && (
                <label>
                  행사 일정
                  <select
                    className={styles.eventSelect}
                    disabled={saving}
                    defaultValue=""
                    onChange={(event) => {
                      const selected = events[Number(event.target.value)];
                      if (selected) selectEvent(selected);
                    }}
                  >
                    <option value="">일정을 선택하거나 직접 입력</option>
                    {events.map((item, index) => (
                      <option key={`${item.title}-${index}`} value={index}>
                        {item.title} · {item.date}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                출석체크 명
                <input
                  id="attendance-title"
                  required
                  maxLength="100"
                  disabled={saving}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="예) 시작발표"
                />
              </label>
              <label>
                출석체크 기간
                <input
                  required
                  disabled={saving}
                  min={today}
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                />
              </label>
              <label>
                출석체크 마감시간
                <input
                  type="time"
                  disabled
                  title="마감시간은 서버 API에서 지원하지 않습니다."
                />
              </label>
              <p className={styles.autoDateNote}>
                서버는 마감시간·지각·생성 및 종료 시각을 제공하지 않습니다. 생성
                후 출석 체크 시작 버튼을 눌러 주세요.
              </p>
              <button
                className={styles.createSubmit}
                type="submit"
                disabled={saving || loading}
              >
                {saving ? "생성 중…" : "출석체크 생성하기"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
};

export default ManageAttendancePage;
