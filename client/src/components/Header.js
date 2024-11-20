import React from "react";
import { useNavigate } from "react-router-dom";
import wapLogo from "../assets/img/WAP_white_NoBG.png";

const Header = ({ toggleMenu }) => {
  const navigate = useNavigate();
  return (
    <header className="App-header">
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
      <div className="menu-icon" onClick={toggleMenu}>
        &#9776;
      </div>
    </header>
  );
};

export default Header;
