import React from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Menu = ({
  menuOpen,
  toggleMenu,
  userName,
  handleLogin,
  handleLogout,
}) => {
  const navigate = useNavigate();

  const handleNavigationWithAuth = (path) => {
    const token = Cookies.get("authToken");
    if (!token) {
      alert("해당 페이지는 로그인을 해야 접속 가능합니다.");
      navigate("/login");
    } else {
      navigate(path);
      toggleMenu();
    }
  };

  return (
    <div className="menuContainer">
      {menuOpen && (
        <nav className="menu">
          <div className="menu-header">
            {userName ? (
              <p className="welcome-message">{userName}님 환영합니다!</p>
            ) : (
              <p></p>
            )}
          </div>

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
            <li onClick={() => handleNavigationWithAuth("/CreatePage")}>
              Create Project
            </li>
            <hr className="line"></hr>
            <li onClick={() => handleNavigationWithAuth("/vote")}>Vote</li>
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
            ) : null}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Menu;
