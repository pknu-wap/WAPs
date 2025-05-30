import { React, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Menu = ({
  menuOpen,
  toggleMenu,
  userName,
}) => {
  const navigate = useNavigate();

  const [canNavigate, setCanNavigate] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!Cookies.get("authToken")); // ✅ 초기값 설정

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
    // 로그인 상태 확인 (초기 mount 시)
    const token = Cookies.get("authToken");
    setIsLoggedIn(!!token);

    // 특정 날짜 이후 접근 허용
    const allowedDate = new Date("2024-11-29T18:00:00");
    const now = new Date();

    if (now >= allowedDate) {
      setCanNavigate(true);
    } else {
      const timeUntilAllowed = allowedDate - now;
      setTimeout(() => {
        setCanNavigate(true);
      }, timeUntilAllowed);
    }
  }, []);

  const handleVotePageNavigate = () => {
    if (canNavigate) {
      handleNavigationWithAuth("/vote");
    } else {
      alert("투표는 2024년 11월 29일 오후 6시부터 가능합니다.");
    }
  };

  const handleLogout = () => {
    Cookies.remove("authToken");
    Cookies.remove("userName");
    setIsLoggedIn(false); // ✅ 상태 수동 갱신
    alert("로그아웃 되었습니다.");
    toggleMenu();
    navigate("/");
  };

  return (
    <div className="menuContainer">
      {menuOpen && (
        <nav className="menu">
          <div className="menu-header">
            {isLoggedIn && userName ? (
              <p className="welcome-message">{userName}님 환영합니다!</p>
            ) : (
              <p></p>
            )}
          </div>

          <ul>
            <hr className="startLine" />
            <li
              onClick={() => {
                if (isLoggedIn) {
                  handleLogout();
                } else {
                  toggleMenu();
                  navigate("/login");
                }
              }}
            >
              {isLoggedIn ? "Logout" : "Login"}
            </li>
            <hr className="line" />
            <li
              onClick={() => {
                navigate("/HomePage");
                toggleMenu();
              }}
            >
              Projects
            </li>
            <hr className="line" />
            <li onClick={() => handleNavigationWithAuth("/project/create")}>
              Create Project
            </li>
            <hr className="line"></hr>
            <li onClick={handleVotePageNavigate}>Vote</li>
            {/*<hr className="line"></hr>
            <li
              onClick={() => {
                navigate("/map");
                toggleMenu();
              }}
            >
              Map
            </li>*/}
            <hr className="startLine"></hr>

          </ul>
        </nav>
      )}
    </div>
  );
};

export default Menu;
