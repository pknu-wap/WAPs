import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Callback = () => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // 카카오 API를 통해 사용자 정보를 가져옴
    window.Kakao.API.request({
      url: '/v2/user/me',
      success: (res) => {
        const formattedUserInfo = {
          userId: res.id,
          userName: res.kakao_account.profile.nickname,
          userEmail: res.kakao_account.email,
        };
        setUserInfo(formattedUserInfo);
      },
      fail: (err) => {
        console.error('사용자 정보 요청 실패:', err);
      },
    });
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
