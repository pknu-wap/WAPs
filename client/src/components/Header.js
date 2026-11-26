import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "../utils/authStorage";
import Menu from "./Menu";
import useCurrentUserName from "../hooks/useCurrentUserName";
import wapsLogo from "../assets/img/waps_logo.png";

const Header = () => {
  const userName = useCurrentUserName();

  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const shouldOpenMenu = sessionStorage.getItem("openMenuAfterBack");

    if (shouldOpenMenu === "true") {
      setMenuOpen(true);
      sessionStorage.removeItem("openMenuAfterBack");
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("authToken");
    Cookies.remove("userName");

    navigate("/login");
  };

  const handleLogin = () => {
    navigate("/login", {
      state: {
        from: window.location.pathname,
      },
    });
  };

  return (
    <>
      <header className="App-header">
        <div className="header-inner">
          <div>
            <button
              type="button"
              aria-label="WAPs 프로젝트 페이지"
              className="waplogo brand-button"
              onClick={() => navigate("/ProjectPage")}
              style={{ cursor: "pointer" }}
            >
              <img
                src={wapsLogo}
                alt="WAPs"
                className="waplogo"
                style={{
                  cursor: "pointer",
                  height: "15px",
                }}
              />
            </button>
          </div>

          {!menuOpen && (
            <nav className="desktop-nav">
              <button onClick={() => navigate("/ProjectPage")}>PROJECT</button>

              <button onClick={() => navigate("/team-build")}>
                TEAMBUILDING
              </button>

              <button onClick={() => navigate("/vote")}>VOTE</button>

              <button
                className="desktop-login"
                onClick={Cookies.get("authToken") ? handleLogout : handleLogin}
              >
                {Cookies.get("authToken") ? "LOGOUT" : "LOGIN"}
              </button>
            </nav>
          )}

          <button
            type="button"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
            className="menu-icon"
            onClick={toggleMenu}
          >
            {menuOpen ? (
              <span aria-hidden="true">✕</span>
            ) : (
              <span className="menu-bar" aria-hidden="true">
                ☰
              </span>
            )}
          </button>
        </div>
      </header>

      <Menu
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        userName={userName}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
      />
    </>
  );
};

export default Header;
