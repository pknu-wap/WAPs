import { useState, useEffect, useRef } from "react";
import styles from "../../assets/Admin/ManagePermission.module.css";
import { adminPermissonApi } from "../../api/admin";

const ROLES = [
  { value: "ROLE_GUEST", label: "게스트" },
  { value: "ROLE_MEMBER", label: "회원" },
  { value: "ROLE_ADMIN", label: "임원" },
];
const LEVELS = [
  { value: "UNDECIDED", label: "미정" },
  { value: "NEW", label: "신입" },
  { value: "ASSOCIATE", label: "준회원" },
  { value: "REGULAR", label: "정회원" },
];
const levelLabel = (value) =>
  LEVELS.find((item) => item.value === value)?.label || value || "미정";
const roleLabel = (value) =>
  ROLES.find((item) => item.value === value)?.label ||
  (value === "ROLE_USER" ? "비회원" : value || "미지정");

export default function ManagePermissionPage() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Map());
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    let active = true;
    setLoading(true);
    setError("");
    adminPermissonApi
      .getUserRoleList(page, 12, roleFilter, levelFilter)
      .then((data) => {
        if (!active || id !== requestId.current) return;
        setUsers(data.content || []);
        setHasNext(Boolean(data.hasNext));
      })
      .catch(() => {
        if (!active || id !== requestId.current) return;
        setUsers([]);
        setHasNext(false);
        setError("사용자 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active && id === requestId.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, roleFilter, levelFilter, revision]);

  const toggle = (user) => {
    if (updating) return;
    setSelected((previous) => {
      const next = new Map(previous);
      if (next.has(user.id)) next.delete(user.id);
      else next.set(user.id, user);
      return next;
    });
    setMessage("");
  };

  const apply = async () => {
    if (updating || loading || (!newRole && !newLevel) || !selected.size)
      return;
    const snapshot = new Map(selected);
    setUpdating(true);
    setError("");
    setMessage("");
    ++requestId.current;
    try {
      const response = await adminPermissonApi.updateUserAttributes({
        userIds: Array.from(snapshot.keys()),
        ...(newRole ? { role: newRole } : {}),
        ...(newLevel ? { memberType: newLevel } : {}),
      });
      if (
        !Array.isArray(response) ||
        response.length !== snapshot.size ||
        new Set(response.map((user) => user.id)).size !== snapshot.size ||
        response.some(
          (user) =>
            !snapshot.has(user.id) ||
            (newRole && user.role !== newRole) ||
            (newLevel && user.memberType !== newLevel),
        )
      )
        throw new Error("Invalid response");
      const changed = new Map(response.map((user) => [user.id, user]));
      setUsers((previous) =>
        previous.map((user) => changed.get(user.id) || user),
      );
      setSelected(
        (previous) =>
          new Map(
            Array.from(previous, ([id, user]) => [id, changed.get(id) || user]),
          ),
      );
      const changes = [
        newRole && `ROLE: ${roleLabel(newRole)}`,
        newLevel && `LEVEL: ${levelLabel(newLevel)}`,
      ]
        .filter(Boolean)
        .join(", ");
      setMessage(`${changed.size}명의 정보를 변경했습니다. (${changes})`);
      setNewRole("");
      setNewLevel("");
      if (roleFilter || levelFilter) setRevision((previous) => previous + 1);
    } catch (failure) {
      setError(
        failure.response?.data?.message ||
          "권한 및 LEVEL 변경에 실패했습니다. 다시 시도해주세요.",
      );
    } finally {
      setUpdating(false);
      setLoading(false);
    }
  };

  const filter = (event, setter) => {
    setter(event.target.value);
    setPage(0);
    setMessage("");
  };
  const options = (items) =>
    items.map((item) => (
      <option key={item.value} value={item.value}>
        {item.label}
      </option>
    ));
  const cells = (user) => (
    <>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>{roleLabel(user.role)}</td>
      <td>{levelLabel(user.memberType)}</td>
    </>
  );
  const headings = (
    <tr>
      <th>NAME</th>
      <th>EMAIL</th>
      <th>ROLE</th>
      <th>LEVEL</th>
    </tr>
  );

  return (
    <div className={styles.container}>
      <section
        className={`${styles.Box} ${styles.listBox}`}
        aria-label="사용자 목록"
      >
        <div className={styles.header}>
          <span>목록</span>
          <div className={styles.filters}>
            <label>
              ROLE{" "}
              <select
                aria-label="ROLE 필터"
                className={styles.filterSelect}
                value={roleFilter}
                disabled={Boolean(updating)}
                onChange={(event) => filter(event, setRoleFilter)}
              >
                <option value="">ALL</option>
                {options(ROLES)}
              </select>
            </label>
            <label>
              LEVEL{" "}
              <select
                aria-label="LEVEL 필터"
                className={styles.filterSelect}
                value={levelFilter}
                disabled={Boolean(updating)}
                onChange={(event) => filter(event, setLevelFilter)}
              >
                <option value="">ALL</option>
                {options(LEVELS)}
              </select>
            </label>
          </div>
        </div>
        <div className={styles.userContent}>
          <div className={styles.userList}>
            {loading ? (
              <p role="status">목록을 불러오는 중...</p>
            ) : (
              <table aria-label="사용자 목록">
                <thead>{headings}</thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      tabIndex={0}
                      aria-selected={selected.has(user.id)}
                      onClick={() => toggle(user)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggle(user);
                        }
                      }}
                      className={
                        selected.has(user.id) ? styles.selectedRow : ""
                      }
                    >
                      {cells(user)}
                    </tr>
                  ))}
                  {!users.length && (
                    <tr>
                      <td colSpan={4}>해당하는 사용자가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          <div className={styles.pageNation}>
            <button
              aria-label="이전 페이지"
              disabled={!page || loading || Boolean(updating)}
              onClick={() => setPage(page - 1)}
            >
              &lt;&lt;
            </button>
            <span>{page + 1}</span>
            <button
              aria-label="다음 페이지"
              disabled={!hasNext || loading || Boolean(updating)}
              onClick={() => setPage(page + 1)}
            >
              &gt;&gt;
            </button>
          </div>
        </div>
      </section>
      <section
        className={`${styles.Box} ${styles.editBox}`}
        aria-label="권한과 레벨 변경"
      >
        <h2 className={styles.header}>권한 / LEVEL 변경</h2>
        <div className={styles.changeContent}>
          <div className={styles.changeList}>
            {!selected.size ? (
              <p className={styles.emptySelection}>
                왼쪽 목록에서 사용자를 클릭하여 추가하세요.
              </p>
            ) : (
              <table aria-label="선택한 사용자">
                <thead>{headings}</thead>
                <tbody>
                  {Array.from(selected.values()).map((user) => (
                    <tr key={user.id} onClick={() => toggle(user)}>
                      {cells(user)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className={styles.changeControls}>
            <div className={styles.controler}>
              <label htmlFor="next-role">다음으로 권한 변경:</label>
              <select
                id="next-role"
                aria-label="변경할 권한"
                className={styles.roleDropdown}
                value={newRole}
                onChange={(event) => setNewRole(event.target.value)}
                disabled={Boolean(updating)}
              >
                <option value="">권한 선택</option>
                {options(ROLES)}
              </select>
            </div>
            <div className={styles.controler}>
              <label htmlFor="next-level">다음으로 LEVEL 변경:</label>
              <select
                id="next-level"
                aria-label="변경할 회원 구분"
                className={styles.roleDropdown}
                value={newLevel}
                onChange={(event) => setNewLevel(event.target.value)}
                disabled={Boolean(updating)}
              >
                <option value="">LEVEL 선택</option>
                {options(LEVELS)}
              </select>
            </div>
          </div>
          <button
            aria-label="선택한 사용자에게 적용"
            className={styles.adjust}
            disabled={
              updating || loading || (!newRole && !newLevel) || !selected.size
            }
            onClick={apply}
          >
            {updating ? "적용 중..." : "적용"}
          </button>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
        </div>
      </section>
    </div>
  );
}
