import React from "react";
import "../../assets/Login.css";
import logo from "../../assets/img/WAP_white_NoBG.png";
import img from "../../assets/img/pngwing.com.png";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleKakaoLogin = () => {
    try {
      console.log("Redirecting to Kakao login...");

      // 현재 URL을 리다이렉트 URI로 설정
      const redirectUri = encodeURIComponent(window.location.href);
      const kakaoLoginUrl = `http://15.164.98.72:8080/oauth2/authorization/kakao?redirect_uri=${redirectUri}`;

      console.log("Kakao login URL:", kakaoLoginUrl);

      // 카카오 인증 URL로 리디렉션
      window.location.href = kakaoLoginUrl;
    } catch (error) {
      console.error("Error during Kakao login redirect:", error);
    }
  };

  const handleProceedWithoutLogin = () => {
    console.log("Proceeding without login...");
    navigate("/"); // 메인 페이지로 이동
  };

  return (
    <div className="login-page">
      <img src={logo} alt="WAP Logo" className="logo-image" />
      <div className="login-buttons">
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
      </div>
    </div>
  );
};

export default Login;