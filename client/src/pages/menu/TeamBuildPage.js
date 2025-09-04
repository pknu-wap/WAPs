// src/pages/menu/TeamBuildPage.js
import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

function TeamBuildPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const token =
      Cookies.get("authToken") ||
      window.localStorage.getItem("authToken") ||
      "";

    if (!token) {
      alert("로그인이 필요합니다. (토큰 없음)");
      navigate("/login"); // 로그인 페이지로 보내기
      return;
    }

    // 서버의 타임리프 페이지로 즉시 이동
    window.location.href = `${process.env.REACT_APP_API_BASE_URL}/team-build`;
  }, []);

  // 실제 화면은 거의 보이지 않음 (redirect가 즉시 실행됨)
  return (
    <div style={{ padding: 24 }}>
      <p>팀빌딩 페이지로 이동 중입니다...</p>
    </div>
  );
}

export default TeamBuildPage;