import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import wapLogo from "../assets/img/WAP_white_NoBG.png";
import Menu from "./Menu"; // Menu 컴포넌트 임포트

const Header = () => {
  const [userName, setUserName] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false); // menuOpen 상태 추가
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // 사용자 정보를 가져오는 함수
  const fetchUserInfo = (token) => {
    // ... 기존 코드 그대로 유지 ...
  };

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      fetchUserInfo(token); // 토큰이 있으면 사용자 정보 가져오기
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("authToken");
    Cookies.remove("userName");
    setUserName(null);
    navigate("/login");
  };

  return (
    <>
      <header className="App-header">
        {/* 로고 */}
        <div className="logo">
          <img
            className="waplogo"
            alt="wap"
            src={wapLogo}
            onClick={() => navigate("/HomePage")}
            style={{
              cursor: "pointer",
            }}
          />
        </div>

        {/* 사용자 정보 및 로그인/로그아웃 버튼 */}
        <div className="user-info">
          {userName ? (
            <>
              <span className="welcome-message">{userName}님 환영합니다!</span>
              <button className="auth-button" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <button
              className="auth-button"
              onClick={() =>
                navigate("/login", { state: { from: window.location.pathname } })
              }
            >
              로그인
            </button>
          )}
        </div>

        {/* 메뉴 아이콘 */}
        <div className="menu-icon" onClick={toggleMenu}>
          {menuOpen ? "✕" : "☰"} {/* 메뉴가 열려 있을 때 "✕" 표시, 닫혔을 때 "☰" 표시 */}
        </div>
      </header>

      {/* 메뉴 컴포넌트 추가 */}
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
    </>
  );
};

export default Header;
