import React from "react";
import { useNavigate } from "react-router-dom";

const Menu = ({ menuOpen, toggleMenu, userName, handleLogin, handleLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="menuContainer">
      {menuOpen && (
        <nav className="menu">
          {/* 메뉴 상단: 000님 환영합니다 */}
          <div className="menu-header">
            {userName ? (
              <p className="welcome-message">{userName}님 환영합니다!</p>
            ) : (
              <p></p>
            )}
          </div>

          {/* 메뉴 리스트 */}
          <ul>
            <hr className="startLine"></hr>
            <li
              onClick={() => {
                navigate("/login");
                toggleMenu();
              }}
            >
              Login
            </li>
            <hr className="line"></hr>
            <li
              onClick={() => {
                navigate("/project");
                toggleMenu();
              }}
            >
              Projects
            </li>
            <hr className="line"></hr>
            <li
              onClick={() => {
                navigate("/CreatePage");
                toggleMenu();
              }}
            >
              Create Project
            </li>
            <hr className="line"></hr>
            <li
              onClick={() => {
                navigate("/vote");
                toggleMenu();
              }}
            >
              Vote
            </li>
            <hr className="line"></hr>
            <li
              onClick={() => {
                navigate("/map");
                toggleMenu();
              }}
            >
              Map
            </li>
            <hr className="line"></hr>
            <li
              onClick={() => {
                navigate("/MyPage");
                toggleMenu();
              }}
            >
              My page
            </li>
            <hr className="startLine"></hr>
          </ul>

          {/* 메뉴 하단: 로그인/로그아웃 텍스트 */}
          <div className="auth-section">
            {userName ? (
              <p
                className="auth-text"
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
              >
                로그아웃
              </p>
            ) : null /* 비로그인 상태에서는 아무것도 표시하지 않음 */}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Menu;
