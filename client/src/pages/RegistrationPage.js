import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { userApi } from "../api/user";
import styles from "../assets/Account.module.css";
import wapsLogo from "../assets/img/waps_logo.png";
import authStorage from "../utils/authStorage";
import { registrationRequired } from "../utils/accountProfile";

function normalizeStudentYear(value) {
  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  return digits.length === 4 || digits.length === 9
    ? digits.slice(2, 4)
    : digits.slice(0, 2);
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
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    let active = true;
    userApi.getMe().then(
      (user) => {
        if (!active) return;
        if (editing) {
          setMembership(user.wapMember === true ? "yes" : user.wapMember === false ? "no" : "");
          setName(user.userName ?? user.name ?? "");
          setStudentId(normalizeStudentYear(user.studentId ?? user.studentNumber));
          setRegistrationStatus("pending");
        } else if (registrationRequired(user) === false) {
          navigate("/ProjectPage", { replace: true });
        } else if (registrationRequired(user) === true) {
          setRegistrationStatus("pending");
        } else {
          setRegistrationStatus("failed");
        }
      },
      () => {
        if (active) setRegistrationStatus("failed");
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
    if (editing) { navigate("/settings"); return; }
    for (const key of ["authToken", "userName", "userRole", "lastPage"]) {
      authStorage.remove(key);
    }
    navigate("/ProjectPage", { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

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
    setSubmitting(true);
    try {
      const user = await (editing ? userApi.updateRegistration : userApi.completeRegistration)(
        wapMember ? { wapMember, name: trimmedName, studentId } : { wapMember },
      );
      if (registrationRequired(user) !== false) {
        setErrorMessage("가입이 완료되지 않았습니다. 다시 시도해주세요.");
        return;
      }
      if (user.userName) {
        authStorage.set("userName", user.userName, { expires: 7 });
      }
      navigate(editing ? "/settings" : "/ProjectPage", { replace: true });
    } catch {
      setErrorMessage("가입 정보를 저장하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) return <Navigate to="/login" replace />;

  return (
    <main className={styles.page}>
      {registrationStatus === "pending" && (
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
                      setStudentId(normalizeStudentYear(event.clipboardData.getData("text")));
                    }}
                  />
                </label>
                <p id="student-id-help" className={styles.fieldHint}>
                  입학 연도 뒤 두 자리를 입력해주세요. 예: 2026 → 26
                </p>
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
