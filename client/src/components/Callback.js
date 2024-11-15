import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Callback = () => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // URL에서 access token 추출
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');

    if (accessToken) {
      // 사용자 정보를 가져오는 요청
      axios.get('http://15.164.98.72:8080/user/me', {
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
      })
      .catch((error) => {
        console.error('사용자 정보 요청 실패:', error);
      });
    }
  }, []);

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
