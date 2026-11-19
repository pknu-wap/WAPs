import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "../utils/authStorage";
import Menu from "./Menu";
import wapsLogo from "../assets/img/waps_logo.png";

const Header = () => {
  const [userName, setUserName] = useState(
    Cookies.get("userName") || null
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const token = Cookies.get("authToken");
    const savedUserName = Cookies.get("userName");

    if (token && savedUserName) {
      setUserName(savedUserName);
    }

    const shouldOpenMenu =
      sessionStorage.getItem("openMenuAfterBack");

    if (shouldOpenMenu === "true") {
      setMenuOpen(true);
      sessionStorage.removeItem("openMenuAfterBack");
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("authToken");
    Cookies.remove("userName");

    setUserName(null);
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
            <p
              className="waplogo"
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
            </p>
          </div>

          <div
            className="menu-icon"
            onClick={toggleMenu}
          >
            {menuOpen ? (
              <p>✕</p>
            ) : (
              <p className="menu-bar">☰</p>
            )}
          </div>
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