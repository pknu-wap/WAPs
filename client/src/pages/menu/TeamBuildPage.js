import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

function TeamBuildPage() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("팀빌딩 페이지로 이동 준비 중...");

  useEffect(() => {
    (async () => {
      const token =
        Cookies.get("authToken") ||
        window.localStorage.getItem("authToken") ||
        "";

      if (!token) {
        alert("로그인이 필요합니다. (토큰 없음)");
        navigate("/login");
        return;
      }

      try {
        setMsg("인증 쿠키 설정 중...");
        // 1) Authorization 헤더를 붙여 /team-build 를 먼저 'fetch'
        //    -> 백엔드가 Set-Cookie(authToken) 내려줌 (SameSite=None; Secure 필요)
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/team-build`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/html",
          },
          // 쿠키 주고받기
          credentials: "include",
          mode: "cors",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        // 2) 이제 브라우저 네비게이션로 실제 Thymeleaf 페이지 로드
        setMsg("이동 중...");
        window.location.href = `${process.env.REACT_APP_API_BASE_URL}/team-build`;
      } catch (e) {
        console.error(e);
        alert("팀빌딩 페이지로 이동 중 오류가 발생했습니다.");
        setMsg("오류가 발생했습니다.");
      }
    })();
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <p>{msg}</p>
    </div>
  );
}

export default TeamBuildPage;
