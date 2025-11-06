import { React, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { FaChevronRight } from "react-icons/fa";
import "../assets/Menu.css";

const Menu = ({ menuOpen, toggleMenu, userName }) => {
  const navigate = useNavigate();

  const [canNavigate, setCanNavigate] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!Cookies.get("authToken"));

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
    const token = Cookies.get("authToken");
    setIsLoggedIn(!!token);

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
      alert("투표는 로그인 이후에 가능합니다.");
    }
  };

  const handleLogout = () => {
    Cookies.remove("authToken");
    Cookies.remove("userName");
    setIsLoggedIn(false);
    alert("로그아웃 되었습니다.");
    toggleMenu();
    navigate("/");
  };

  return (
    <div className="menuContainer">
      {menuOpen && (
        <nav className="menu">
          <div className="menu-content">
            {isLoggedIn && userName ? (
              <p className="welcome-message">{userName}님 환영합니다.</p>
            ) : (
              <p className="welcome-message">로그인을 해주십시오.</p>
            )}

            <h2 className="menu-title">MENU PAGE</h2>

            <div className="menu-section">
              <h3 className="section-title">PROJECTS</h3>
              <div className="menu-items">
                <button
                  className="menu-item"
                  onClick={() => {
                    navigate("/ProjectPage");
                    toggleMenu();
                  }}
                >
                  <span>프로젝트 Projects</span>
                  <span className="arrow"><FaChevronRight /></span>
                </button>
                <button
                  className="menu-item"
                  onClick={() => handleNavigationWithAuth("/project/create")}
                >
                  <span>프로젝트 만들기 Create Project</span>
                  <span className="arrow"><FaChevronRight /></span>
                </button>
              </div>
            </div>

            <div className="menu-section">
              <h3 className="section-title">TEAMBUILDING</h3>
              <div className="menu-items">
                <button
                  className="menu-item"
                  onClick={() => handleNavigationWithAuth("/team-build")}
                >
                  <span>팀빌딩 Team Building</span>
                  <span className="arrow"><FaChevronRight /></span>
                </button>
                <button
                  className="menu-item"
                  onClick={() => navigate("/team-build/result")}
                >
                  <span>팀빌딩 결과 Team Building Result</span>
                  <span className="arrow"><FaChevronRight /></span>
                </button>
              </div>
            </div>

            <div className="menu-section">
              <h3 className="section-title">VOTE</h3>
              <div className="menu-items">
                <button
                  className="menu-item"
                  onClick={handleVotePageNavigate}
                >
                  <span>투표 Vote</span>
                  <span className="arrow"><FaChevronRight /></span>
                </button>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={() => {
                if (isLoggedIn) {
                  handleLogout();
                } else {
                  toggleMenu();
                  navigate("/login");
                }
              }}
            >
              {isLoggedIn ? "로그아웃 Logout" : "로그인 Login"}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Menu;