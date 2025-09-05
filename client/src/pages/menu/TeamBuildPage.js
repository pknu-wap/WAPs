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
    navigate("/login");
    return;
  }

  fetch(`${process.env.REACT_APP_API_BASE_URL}/team-build`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/html",
    },
    credentials: "include", // 쿠키도 같이 보낼 수 있음
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((html) => {
      // 받아온 타임리프 HTML을 현재 페이지에 직접 렌더링
      document.open();
      document.write(html);
      document.close();
    })
    .catch((err) => {
      console.error(err);
      setError("팀빌딩 페이지를 불러오는 중 오류 발생");
    });
}, []);
}

export default TeamBuildPage;