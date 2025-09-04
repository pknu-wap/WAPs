import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

function TeamBuildResultPage() {
  const navigate = useNavigate();

  useEffect(() => {
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