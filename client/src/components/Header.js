import React from 'react';
import wapLogo from '../assets/img/WAP_white_NoBG.png';

const Header = ({ menuOpen,toggleMenu }) => {
  return (
    <header className="App-header">
      <div className="logo">
        <img className="waplogo" alt="wap" src={wapLogo} />
      </div>
      <div className="menu-icon" onClick={toggleMenu}>
        {menuOpen ? "✕" : "☰"} {/* 메뉴가 열려 있을 때 "✕" 표시, 닫혔을 때 "☰" 표시 */}
      </div>
    </header>
  );
};

export default Header;
