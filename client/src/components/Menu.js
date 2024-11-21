import React from "react";
import { useNavigate } from "react-router-dom";

const Menu = ({ menuOpen, toggleMenu }) => {
  const navigate = useNavigate();

  return (
    <>
      <div class="menuContainer">
        {menuOpen && (
          <nav className="menu">
            <div>
              <ul>
                <hr className='startLine'></hr>
                <li
                  onClick={() => {
                    navigate("/login");
                    toggleMenu();
                  }}
                >
                  Login
                </li>
                <hr className='line'></hr>
                <li
                  onClick={() => {
                    navigate("/project");
                    toggleMenu();
                  }}
                >
                  Projects
                </li>
                <hr className='line'></hr>
                <li
                  onClick={() => {
                    navigate("/CreatePage");
                    toggleMenu();
                  }}
                >
                  Create Project
                </li>
                <hr className='line'></hr>
                <li
                  onClick={() => {
                    navigate("/vote");
                    toggleMenu();
                  }}
                >
                  Vote
                </li>
                <hr className='line'></hr>
                <li
                  onClick={() => {
                    navigate("/map");
                    toggleMenu();
                  }}
                >
                  Map
                </li>
                <hr className='line'></hr>
                <li
                  onClick={() => {
                    navigate("/MyPage");
                    toggleMenu();
                  }}
                >
                  My page
                </li>
                <hr className='startLine'></hr>
              </ul>
            </div>
          </nav>
        )}
      </div>
    </>

  );
};

export default Menu;
