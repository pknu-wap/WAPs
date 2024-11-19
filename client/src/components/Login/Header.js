import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
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
    // 현재 URL에서 토큰을 가져옴
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      handleLoginSuccess(token);
      // URL에서 토큰 제거
      window.history.replaceState({}, document.title, window.location.pathname);
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
    fetch('http://15.164.98.72:8080/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        Cookies.set('userName', data.userName, { expires: 7 });
        Cookies.set('authToken', token, { expires: 7 });
        setUserName(data.userName);
      })
      .catch((error) =>
        console.error('사용자 정보를 가져오는 동안 에러 발생:', error)
      );
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
