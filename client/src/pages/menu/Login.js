import React from 'react';
import '../../assets/Login.css';
import logo from '../../assets/img/WAP_white_NoBG.png';

const Login = () => {
  const handleKakaoLogin = () => {
    // 카카오 로그인 함수 (구현된 함수 호출)
  };

  const handleGoogleLogin = () => {
    // 구글 로그인 함수 (구현된 함수 호출)
  };

  const handleAppleLogin = () => {
    // 애플 로그인 함수 (구현된 함수 호출)
  };

  return (
    <div className="login-page">
      <img src={logo} alt="WAP Logo" className="logo-image" />
      <div className="login-buttons">
        <button className="login-button kakao" onClick={handleKakaoLogin}>
          <span>카카오로 로그인</span>
        </button>
        <button className="login-button google" onClick={handleGoogleLogin}>
          <span>구글로 로그인</span>
        </button>
        <button className="login-button apple" onClick={handleAppleLogin}>
          <span>애플로 로그인</span>
        </button>
      </div>
      <button className="login-button primary">로그인</button>
    </div>
  );
};

export default Login;
