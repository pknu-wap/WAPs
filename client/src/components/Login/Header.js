import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import styles from '../styles/Header.module.css';

function Header() {
  const logo_uri = process.env.PUBLIC_URL + '/public_assets/logo.svg';
  const [userName, setUserName] = useState(null);
  const navigate = useNavigate();

  const handleLogin = () => {
    const redirectUri = encodeURIComponent(window.location.href);
    window.location.href = `http://15.164.98.72:8080/oauth2/authorization/kakao?redirect_uri=${redirectUri}`;
  };

  const handleLogout = () => {
    Cookies.remove('authToken');
    Cookies.remove('userName');

    setUserName(null);

    navigate('/');
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      handleLoginSuccess(token);

      // URL에서 토큰 제거
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/MainPage');
    } else {
      const storedToken = Cookies.get('authToken');
      const storedUserName = Cookies.get('userName');

      if (!storedUserName && storedToken) {
        fetchUserInfo(storedToken);
      } else {
        setUserName(storedUserName);
      }
    }
  }, []);

  const handleLoginSuccess = (token) => {
    Cookies.set('authToken', token, { expires: 7 }); // 쿠키에 7일간 저장
    fetchUserInfo(token);
  };

  const fetchUserInfo = (token) => {
    axios
      .get('http://15.164.98.72:8080/user/me', {
        headers: {
          Authorization: `Bearer ${token}`, // JWT 토큰을 Authorization 헤더에 추가
        },
      })
      .then((response) => {
        if (response.status !== 200) {
          console.error('Unexpected status code:', response.status);
          return; // 상태 코드가 200이 아닌 경우 처리 중단
        }

        // 사용자 정보를 쿠키에 저장
        Cookies.set('userName', response.data.userName, { expires: 7 });
        Cookies.set('authToken', token, { expires: 7 });

        setUserName(response.data.userName); // 상태 업데이트
      })
      .catch((error) => {
        console.error('Failed to fetch user info:', error);
        Cookies.remove('authToken'); // 인증 실패 시 토큰 삭제
        navigate('/login'); // 로그인 페이지로 리다이렉트
      });
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <Link to="/">
          <img src={logo_uri} alt="Logo" />
        </Link>
      </div>
      <div className={styles.navLinks}>
        <Link to="/project">프로젝트</Link>
        <Link to="/vote">투표</Link>
        <Link to="/mypage">마이페이지</Link>
      </div>
      <div className={styles.userContainer}>
        {userName ? (
          <div>
            <span>{userName}님 환영합니다!</span>
            <button onClick={handleLogout}>로그아웃</button>
          </div>
        ) : (
          <button onClick={handleLogin}>카카오 로그인</button>
        )}
      </div>
    </header>
  );
}

export default Header;
