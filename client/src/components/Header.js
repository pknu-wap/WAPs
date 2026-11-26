import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "../utils/authStorage";
import Menu from "./Menu";
import useCurrentUserName from "../hooks/useCurrentUserName";
import wapsLogo from "../assets/img/waps_logo.png";

const Header = () => {
  const userName = useCurrentUserName();

  const [menuOpen, setMenuOpen] = useState(false);
  const brandButton = useRef(null);
  const menuButton = useRef(null);
  const menuPanel = useRef(null);

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

  useEffect(() => {
    if (!menuOpen) return;
    menuButton.current.focus();

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current.focus();
      } else if (event.key === "Tab") {
        const actions = menuPanel.current.querySelectorAll("button:enabled");
        const lastAction = actions[actions.length - 1];
        if (event.shiftKey && document.activeElement === brandButton.current) {
          event.preventDefault();
          lastAction.focus();
        } else if (!event.shiftKey && document.activeElement === lastAction) {
          event.preventDefault();
          brandButton.current.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

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
              ref={brandButton}
              onClick={() => {
                setMenuOpen(false);
                navigate("/ProjectPage");
              }}
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
            aria-controls={menuOpen ? "site-menu" : undefined}
            ref={menuButton}
            className="menu-icon"
            onClick={toggleMenu}
          >
            <span className="menu-icon-symbol" aria-hidden="true">
              {menuOpen ? "✕" : <span className="menu-bar">☰</span>}
            </span>
          </button>
        </div>
      </header>

      <Menu
        menuOpen={menuOpen}
        menuRef={menuPanel}
        toggleMenu={toggleMenu}
        userName={userName}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
      />
    </>
  );
};

export default Header;
