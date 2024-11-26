import { React, useState, useEffect } from "react";
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
  const [canNavigate, setCanNavigate] = useState(false);

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

  useEffect(() => {
    // 특정 시간을 설정 (2024년 11월 29일 오후 6시 30분)
    const allowedDate = new Date("2024-11-29T18:30:00");
    const now = new Date();

    if (now >= allowedDate) {
      setCanNavigate(true); // 조건 만족 시 이동 가능
    } else {
      const timeUntilAllowed = allowedDate - now;

      // 특정 시간 이후에 상태를 변경
      setTimeout(() => {
        setCanNavigate(true);
      }, timeUntilAllowed);
    }
  }, []);

  const handleVotePageNavigate = () => {
    if (canNavigate) {
      handleNavigationWithAuth("/vote"); // 이동할 페이지 경로
    } else {
      alert("투표는 2024년 11월 29일 오후 6시 30분부터 가능합니다.");
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
                navigate("/HomePage");
                toggleMenu();
              }}
            >
              Projects
            </li>
            <hr className="line"></hr>
            <li onClick={() => handleNavigationWithAuth("/project/create")}>
              Create Project
            </li>
            <hr className="line"></hr>
            <li onClick={() => handleVotePageNavigate("/vote")}>Vote</li>
            <hr className="line"></hr>
            <li
              onClick={() => {
                navigate("/map");
                toggleMenu();
              }}
            >
              Map
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
