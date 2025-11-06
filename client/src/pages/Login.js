// pages/menu/Login.js
import React from "react";
import "../assets/Login.css";
import img from "../assets/img/pngwing.com.png";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Login = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!Cookies.get("authToken");

  const handleKakaoLogin = () => {
    try {
      const redirectUri = encodeURIComponent(
        `${window.location.origin}/oauth/callback`
      );
      const kakaoLoginUrl = `${process.env.REACT_APP_API_BASE_URL}/oauth2/authorization/kakao?redirect_uri=${redirectUri}`;
      window.location.href = kakaoLoginUrl;
    } catch (error) {
      console.error("Error during Kakao login redirect:", error);
    }
  };

  const handleProceedWithoutLogin = () => {
    navigate("/"); // 메인 페이지로 이동
  };

  const handleLogout = () => {
    Cookies.remove("authToken");
    Cookies.remove("userName");
    alert("로그아웃 되었습니다.");
    navigate("/login");
  };

  return (
    <div className="login-page">
      <button className="close-button" onClick={() => navigate("/HomePage")}>
        &times;
      </button>
      <div className="login-caption">
        <p>WAP에서의</p>
        <p>프로젝트를 만나보세요</p>
      </div>
      <div className="login-buttons">
        {isLoggedIn ? (
          <button className="login-button logout" onClick={handleLogout}>
            로그아웃
          </button>
        ) : (
          <>
            <button className="login-button kakao" onClick={handleKakaoLogin}>
              <img src={img} alt="Kakao Logo" className="Kakao-image" />
              <span>카카오로 로그인</span>
            </button>
            <button
              className="login-button no-login"
              onClick={handleProceedWithoutLogin}
            >
              <span>로그인 없이 진행</span>
            </button>
            <div className="login-mini-caption">WAPs는 카카오로 로그인이 가능합니다.</div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
