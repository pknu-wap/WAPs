import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const ProtectedPage = () => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // 쿠키에서 토큰 가져오기
    const token = Cookies.get("authToken");
    if (!token) {
      console.error("No token found. Redirecting to login...");
      window.location.href = "/login"; // 토큰 없을 시 로그인 페이지로 리다이렉트
      return;
    }

    console.log("Token found:", token);

    // 사용자 정보 요청
    axios
      .get("http://15.164.98.72:8080/user/me", {
        headers: {
          Authorization: `Bearer ${token}`, // JWT 토큰을 Authorization 헤더에 추가
        },
      })
      .then((response) => {
        console.log("User info received:", response.data);
        setUserInfo(response.data); // 사용자 정보 저장
      })
      .catch((error) => {
        console.error("Failed to fetch user info:", error);
        window.location.href = "/login"; // 실패 시 로그인 페이지로 리다이렉트
      });
  }, []);

  // 로딩 중일 때
  if (!userInfo) {
    return <p>Loading...</p>;
  }

  // 사용자 정보 렌더링
  return (
    <div>
      <h2>사용자 정보</h2>
      <p>이름: {userInfo.name}</p>
      <p>이메일: {userInfo.email}</p>
    </div>
  );
};

export default ProtectedPage;