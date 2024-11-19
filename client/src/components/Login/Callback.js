import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Callback component mounted.");

    // URL에서 token 추출
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      alert("로그인 토큰을 찾을 수 없습니다. 다시 로그인해 주세요.");
      console.error("Token not found in URL. Redirecting to login...");
      navigate("/login");
      return;
    }

    console.log("Token received:", token);

    // 토큰을 쿠키에 저장
    Cookies.set("authToken", token, { expires: 1, secure: false, sameSite: 'Lax' });

    // 메인 페이지로 이동
    navigate("/");
  }, [navigate]);

  return (
    <div>
      <h2>로그인 처리 중...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
};

export default Callback;