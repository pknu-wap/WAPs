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
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <p>{msg}</p>
    </div>
  );
}

export default TeamBuildPage;
