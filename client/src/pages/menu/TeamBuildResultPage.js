import React, { useEffect } from "react";
import Cookies from "js-cookie";

function TeamBuildResultPage() {
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

    // 서버 타임리프 결과 페이지로 이동
    window.location.href = `${process.env.REACT_APP_API_BASE_URL}/team-build/results`;
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <p>팀빌딩 결과 페이지로 이동 중입니다...</p>
    </div>
  );
}

export default TeamBuildResultPage;