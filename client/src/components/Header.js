import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import wapLogo from "../assets/img/WAP_white_NoBG.png";

const Header = ({ toggleMenu }) => {
  const [userName, setUserName] = useState(null);
  const navigate = useNavigate();

  // 사용자 정보를 가져오는 함수
  const fetchUserInfo = (token) => {
    fetch("http://15.164.98.72:8080/user/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch user info.");
        }
        return response.json();
      })
      .then((data) => {
        // 사용자 이름 및 토큰 쿠키에 저장
        Cookies.set("userName", data.userName, { expires: 7 });
        Cookies.set("authToken", token, { expires: 7 });
        setUserName(data.userName); // 상태 업데이트
      })
      .catch((error) =>
        console.error("사용자 정보를 가져오는 동안 에러 발생:", error)
      );
  };

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      fetchUserInfo(token); // 토큰이 있으면 사용자 정보 가져오기
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("authToken");
    Cookies.remove("userName");
    setUserName(null);
    navigate("/login");
  };

  return (
    <header className="App-header">
      {/* 로고 */}
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

      {/* 사용자 정보 및 로그인/로그아웃 버튼 */}
      <div className="user-info">
        {userName ? (
          <>
            <span className="welcome-message">{userName}님 환영합니다!</span>
            <button className="auth-button" onClick={handleLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <button
            className="auth-button"
            onClick={() =>
              navigate("/login", { state: { from: window.location.pathname } })
            }
          >
            로그인
          </button>
        )}
      </div>

      {/* 메뉴 아이콘 */}
      <div className="menu-icon" onClick={toggleMenu}>
        &#9776;
      </div>
    </header>
  );
};

export default Header;
