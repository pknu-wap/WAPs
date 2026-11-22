import React, { useEffect, useRef, useState } from "react";
import styles from "../assets/RoleSelect.module.css";
import { userApi } from "../api/user";
import authStorage from "../utils/authStorage";
import { useNavigate } from "react-router-dom";

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [name, setName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [memberType, setMemberType] = useState("NEW");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const pending = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setReady(false);
    setError("");
    userApi.getMe().then(async (profile) => {
      if (!active) return;
      if (profile.signupCompleted) {
        const role = await userApi.getRole();
        if (!active) return;
        authStorage.set("userName", profile.userName, { expires: 7 });
        authStorage.set("userRole", role.role, { expires: 7 });
        navigate("/ProjectPage", { replace: true });
      } else {
        setName(profile.userName || "");
        setReady(true);
      }
    }).catch(() => {
      if (active) setError("가입 정보를 불러오지 못했습니다. 다시 시도해주세요.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate, revision]);

  const submit = async (event) => {
    event.preventDefault();
    if (pending.current || member === null || loading || !ready) return;
    if (member && (!name.trim() || !/^[0-9]{1,20}$/.test(studentNumber))) {
      setError("이름과 숫자 1~20자리 학번을 입력해주세요.");
      return;
    }
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      let profile;
      try {
        profile = await userApi.signup(member ? { member: true, name: name.trim(), studentNumber, memberType } : { member: false });
      } catch (failure) {
        if (failure.response?.status !== 409) throw failure;
        profile = await userApi.getMe();
      }
      if (!profile.signupCompleted) throw new Error("Signup incomplete");
      const role = await userApi.getRole();
      authStorage.set("userName", profile.userName, { expires: 7 });
      authStorage.set("userRole", role.role, { expires: 7 });
      navigate("/ProjectPage", { replace: true });
    } catch {
      setError("가입을 완료하지 못했습니다. 입력값과 연결을 확인하고 다시 시도해주세요.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };

  return <main className={styles.mainContainer}>
    <form className={styles.roleSelectForm} onSubmit={submit}>
      <h1 className={styles.question}>WAP 회원이신가요?</h1>
      {loading && <p role="status">가입 정보를 불러오는 중입니다.</p>}
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={loading || saving || !ready} className={styles.btnGroup}>
        <legend>회원 여부</legend>
        <label><input type="radio" name="member" checked={member === true} onChange={() => setMember(true)} /> 예</label>
        <label><input type="radio" name="member" checked={member === false} onChange={() => setMember(false)} /> 아니오</label>
        {member && <>
          <label>이름<input required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>학번<input required inputMode="numeric" pattern="[0-9]{1,20}" maxLength={20} value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} /></label>
          <label>회원 구분<select value={memberType} onChange={(event) => setMemberType(event.target.value)}>
            <option value="NEW">신입회원</option><option value="ASSOCIATE">준회원</option><option value="REGULAR">정회원</option>
          </select></label>
        </>}
        <button className={styles.roleButton} disabled={member === null} type="submit">{saving ? "저장 중..." : "가입 완료"}</button>
      </fieldset>
      {error && <button type="button" disabled={saving || loading} onClick={() => setRevision((value) => value + 1)}>가입 상태 다시 확인</button>}
    </form>
  </main>;
}
