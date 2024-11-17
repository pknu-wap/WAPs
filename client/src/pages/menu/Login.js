import React from 'react';
import '../../assets/Login.css';
import logo from '../../assets/img/WAP_white_NoBG.png';
import { isAuthenticated } from '../../utils/auth'; // '../utils/auth'를 '../../utils/auth'로 변경


const Login = () => {
  const handleKakaoLogin = () => {
    window.location.href = 'http://15.164.98.72:8080/oauth2/authorization/kakao'; // 서버 배포 주소
  };

  const handleLoginSuccess = (token) => {
    localStorage.setItem('token', token); // 토큰 저장
    window.location.href = '/'; // 홈으로 리다이렉트
  };

  return (
    <div className="login-page">
      <img src={logo} alt="WAP Logo" className="logo-image" />
      <div className="login-buttons">
        <button className="login-button kakao" onClick={handleKakaoLogin}>
          <span>카카오로 로그인</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
