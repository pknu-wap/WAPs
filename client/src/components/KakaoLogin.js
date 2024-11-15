import React from 'react';

function KakaoLogin() {
  const handleKakaoLogin = () => {
    // 백엔드에서 설정한 카카오 로그인 URL로 리다이렉션
    window.location.href = '/oauth2/authorization/kakao';
  };

  return (
    <div>
      <h1>소셜 로그인</h1>
      <button onClick={handleKakaoLogin}>카카오로 로그인</button>
    </div>
  );
}

export default KakaoLogin;
