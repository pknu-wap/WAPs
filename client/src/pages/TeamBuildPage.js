import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

function TeamBuildPage() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("팀빌딩 페이지로 이동 준비 중...");

  useEffect(() => {
    const token =
      Cookies.get("authToken") ||
      window.localStorage.getItem("authToken") ||
      "";

    if (!token) {
      alert("로그인이 필요합니다. (토큰 없음)");
      navigate("/login");
      return;
    }

    alert("현재 팀빌딩이 열려 있지 않습니다!");
    navigate("/ProjectPage");
    // REACT_APP_API_BASE_URL 뒤에 슬래시가 중복되지 않도록 정리
    // const base = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, "");

    // URL 파라미터로 token 전달
    // setMsg("이동 중...");
    // window.location.href = `${process.env.REACT_APP_API_BASE_URL}/team-build?token=${encodeURIComponent(token)}`;
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <p>{msg}</p>
    </div>
  );
}

export default TeamBuildPage;
