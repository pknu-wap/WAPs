import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Callback = () => {
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // URL에서 access token 추출
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');

    if (accessToken) {
      // 사용자 정보를 가져오는 요청
      axios
        .get('http://15.164.98.72:8080/user/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          setUserInfo({
            userId: response.data.id,
            userName: response.data.kakao_account.profile.nickname,
            userEmail: response.data.kakao_account.email,
          });

          // 토큰을 localStorage에 저장 (로그인 상태 유지)
          localStorage.setItem('token', accessToken);

          // 사용자 정보를 성공적으로 가져오면 메인 페이지로 이동
          navigate('/');
        })
        .catch((error) => {
          console.error('사용자 정보 요청 실패:', error);

          // 실패 시 로그인 페이지로 리다이렉트
          navigate('/login');
        });
    } else {
      // accessToken이 없으면 로그인 페이지로 리다이렉트
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div>
      <h2>사용자 정보</h2>
      {userInfo ? (
        <div>
          <p>회원 ID: {userInfo.userId}</p>
          <p>회원 이름: {userInfo.userName}</p>
          <p>회원 이메일: {userInfo.userEmail}</p>
        </div>
      ) : (
        <p>사용자 정보를 불러오는 중...</p>
      )}
    </div>
  );
};

export default Callback;
