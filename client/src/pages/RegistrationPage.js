import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { userApi } from "../api/user";
import styles from "../assets/Account.module.css";
import wapsLogo from "../assets/img/waps_logo.png";
import authStorage from "../utils/authStorage";

export default function RegistrationPage() {
  const navigate = useNavigate();
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
        if (user.registrationRequired === false) {
          navigate("/ProjectPage", { replace: true });
        } else if (user.registrationRequired === true) {
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
  }, [token, navigate, lookupAttempt]);

  function retryLookup() {
    setRegistrationStatus("loading");
    setLookupAttempt((attempt) => attempt + 1);
  }

  function closeRegistration() {
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
    if (wapMember && (!trimmedName || !/^[0-9]{9}$/.test(studentId))) {
      setErrorMessage("본명과 9자리 학번을 입력해주세요.");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);
    try {
      const user = await userApi.completeRegistration(
        wapMember ? { wapMember, name: trimmedName, studentId } : { wapMember },
      );
      if (user.registrationRequired !== false) {
        setErrorMessage("가입이 완료되지 않았습니다. 다시 시도해주세요.");
        return;
      }
      if (user.userName) {
        authStorage.set("userName", user.userName, { expires: 7 });
      }
      navigate("/ProjectPage", { replace: true });
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
                    placeholder="이름은 반드시 본명으로 설정해주세요."
                    maxLength={50}
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
                    pattern="[0-9]{9}"
                    maxLength={9}
                    title="숫자 9자리"
                    placeholder="ex) 202612345"
                    required
                    disabled={submitting}
                    value={studentId}
                    onChange={(event) => setStudentId(event.target.value)}
                  />
                </label>
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
              {submitting ? "저장 중…" : "회원가입하기"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
