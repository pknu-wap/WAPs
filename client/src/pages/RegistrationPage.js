import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { userApi } from "../api/user";
import styles from "../assets/Account.module.css";
import wapsLogo from "../assets/img/waps_logo.png";
import authStorage from "../utils/authStorage";
import { registrationRequired } from "../utils/accountProfile";
import { clearPendingAttendance, consumePendingAttendance } from "../utils/pendingAttendance";

function normalizeStudentYear(value) {
  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  return digits.length === 4 || digits.length === 9
    ? digits.slice(2, 4)
    : digits;
}

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editing = searchParams.get("edit") === "true";
  const token = authStorage.get("authToken");
  const [registrationStatus, setRegistrationStatus] = useState("loading");
  const [lookupAttempt, setLookupAttempt] = useState(0);
  const [membership, setMembership] = useState("");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [memberType, setMemberType] = useState("NEW");
  const [submitting, setSubmitting] = useState(false);
  const pending = useRef(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    let active = true;
    userApi.getMe().then(
      (user) => {
        if (!active) return;
        if (editing && registrationRequired(user) === false) {
          setMembership(user.wapMember === true ? "yes" : user.wapMember === false ? "no"
            : user.studentNumber || user.studentId || user.memberType ? "yes" : "");
          setName(user.userName ?? user.name ?? "");
          setStudentId(normalizeStudentYear(user.studentNumber ?? user.studentId));
          setRegistrationStatus("pending");
        } else if (registrationRequired(user) === false) {
          navigate(consumePendingAttendance(), { replace: true });
        } else if (registrationRequired(user) === true) {
          if (editing) navigate("/signup", { replace: true });
          else setRegistrationStatus("pending");
        } else {
          setRegistrationStatus("failed");
        }
      },
      (error) => {
        if (!active) return;
        if (error.response?.status === 401) {
          authStorage.remove("authToken");
          navigate("/login", { replace: true });
        } else setRegistrationStatus("failed");
      },
    );

    return () => {
      active = false;
    };
  }, [token, navigate, lookupAttempt, editing]);

  function retryLookup() {
    setRegistrationStatus("loading");
    setLookupAttempt((attempt) => attempt + 1);
  }

  function closeRegistration() {
    if (editing) {
      navigate("/settings");
      return;
    }
    clearPendingAttendance();
    for (const key of ["authToken", "userName", "userRole", "lastPage"]) {
      authStorage.remove(key);
    }
    navigate("/ProjectPage", { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending.current || registrationStatus !== "pending") return;

    const wapMember = membership === "yes";
    const trimmedName = name.trim();
    if (!membership) {
      setErrorMessage("WAP 회원 여부를 선택해주세요.");
      return;
    }
    if (wapMember && trimmedName.length > 4) {
      setErrorMessage("이름은 4자 이내로 입력해주세요.");
      return;
    }
    if (wapMember && (!trimmedName || !/^[0-9]{2}$/.test(studentId))) {
      setErrorMessage("본명과 학번(입학 연도 뒤 두 자리)을 입력해주세요.");
      return;
    }

    setErrorMessage("");
    pending.current = true;
    setSubmitting(true);
    try {
      let user;
      if (editing) {
        user = await userApi.updateRegistration(wapMember
          ? { member: true, name: trimmedName, studentNumber: studentId }
          : { member: false });
      } else try {
        user = await userApi.signup(wapMember
          ? { member: true, name: trimmedName, studentNumber: studentId, memberType }
          : { member: false });
      } catch (error) {
        if (error.response?.status !== 409) throw error;
        user = await userApi.getMe();
      }
      if (registrationRequired(user) !== false) {
        setErrorMessage("가입이 완료되지 않았습니다. 다시 시도해주세요.");
        return;
      }
      if (user.userName) {
        authStorage.set("userName", user.userName, { expires: 7 });
      }
      if (editing) {
        navigate("/settings", { replace: true });
        return;
      }
      const role = await userApi.getRole().catch(() => null);
      if (role?.role) authStorage.set("userRole", role.role, { expires: 7 });
      else authStorage.remove("userRole");
      navigate(editing ? "/settings" : consumePendingAttendance(), { replace: true });
    } catch (error) {
      if (error.response?.status === 401) {
        authStorage.remove("authToken");
        navigate("/login", { replace: true });
        return;
      }
      setErrorMessage("가입 정보를 저장하지 못했습니다. 다시 시도해주세요.");
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  if (!token) return <Navigate to="/login" replace />;

  return (
    <main className={styles.page}>
      {registrationStatus !== "loading" && (
        <button
          className={styles.closeButton}
          type="button"
          aria-label="가입 화면 닫기"
          disabled={submitting}
          onClick={closeRegistration}
        >
          ×
        </button>
      )}
      <div className={`${styles.content} ${styles.registrationContent}`}>
        <header className={styles.header}>
          <h1 className={styles.eyebrow}>CREATE AN ACCOUNT</h1>
          <img className={styles.logo} src={wapsLogo} alt="WAPs" />
        </header>
        {registrationStatus === "loading" && (
          <p role="status">가입 상태를 확인하는 중입니다.</p>
        )}
        {registrationStatus === "failed" && (
          <>
            <p className={styles.error} role="alert">
              가입 상태를 확인하지 못했습니다.
            </p>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={retryLookup}
            >
              다시 시도
            </button>
          </>
        )}
        {registrationStatus === "pending" && (
          <form
            className={styles.registrationForm}
            onSubmit={handleSubmit}
          >
            <fieldset className={styles.membership} disabled={submitting}>
              <legend className={styles.fieldLabel}>
                WAP 회원이신가요? <span>Are you a WAP Member?</span>
              </legend>
              <div className={styles.membershipOptions}>
                <label>
                  <input
                    type="radio"
                    name="membership"
                    value="yes"
                    required
                    checked={membership === "yes"}
                    onChange={(event) => setMembership(event.target.value)}
                  />
                  네
                </label>
                <label>
                  <input
                    type="radio"
                    name="membership"
                    value="no"
                    checked={membership === "no"}
                    onChange={(event) => setMembership(event.target.value)}
                  />
                  아니요
                </label>
              </div>
            </fieldset>
            {membership === "yes" && (
              <div className={styles.memberFields}>
                <label className={styles.fieldLabel}>
                  이름 <span>Name</span>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="본명을 4자 이내로 입력해주세요."
                    maxLength={4}
                    title="본명 최대 4자"
                    required
                    disabled={submitting}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className={styles.fieldLabel}>
                  학번 <span>School ID</span>
                  <input
                    type="text"
                    name="studentId"
                    inputMode="numeric"
                    pattern="[0-9]{2}"
                    maxLength={2}
                    title="입학 연도 뒤 두 자리 (예: 2026 → 26)"
                    placeholder="학번을 입력해주세요. (예: 26)"
                    aria-describedby="student-id-help"
                    required
                    disabled={submitting}
                    value={studentId}
                    onChange={(event) => setStudentId(event.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                    onPaste={(event) => {
                      event.preventDefault();
                      const year = normalizeStudentYear(event.clipboardData.getData("text"));
                      if (/^[0-9]{2}$/.test(year)) {
                        setStudentId(year);
                        setErrorMessage("");
                      } else setErrorMessage("두 자리 학번, 네 자리 입학 연도 또는 아홉 자리 학번을 붙여 넣어주세요.");
                    }}
                  />
                </label>
                <p id="student-id-help" className={styles.fieldHint}>
                  입학 연도 뒤 두 자리를 입력해주세요. 예: 2026 → 26
                </p>
                {!editing && <label className={styles.fieldLabel}>
                  회원 구분
                  <select value={memberType} disabled={submitting} onChange={(event) => setMemberType(event.target.value)}>
                    <option value="NEW">신입회원</option>
                    <option value="ASSOCIATE">준회원</option>
                    <option value="REGULAR">정회원</option>
                  </select>
                </label>}
              </div>
            )}
            {errorMessage && (
              <p className={styles.error} role="alert">
                {errorMessage}
              </p>
            )}
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "저장 중…" : editing ? "가입 정보 저장" : "회원가입하기"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
