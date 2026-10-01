import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "../utils/authStorage";
import { FaUser, FaPen } from "react-icons/fa";
import "../assets/Settings.css";

const Settings = () => {
  const navigate = useNavigate();

  // 카카오에서 가져온 사용자 이름
  const [userName, setUserName] = useState("");

  // 백엔드에서 회원 구분 가져오기
  const [userType, setUserType] = useState("");

  useEffect(() => {
    // 카카오 로그인 후 저장된 사용자 이름 가져오기
    const kakaoUserName = Cookies.get("userName");

    if (kakaoUserName) {
      setUserName(kakaoUserName);
    }

    // 백엔드에서 회원 구분 가져오기
    const fetchMemberInfo = async () => {
      try {
        const token = Cookies.get("authToken");

        const response = await fetch("/api/member", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("회원 정보를 불러오지 못했습니다.");
        }

        const data = await response.json();

        // 회원 구분
        setUserType(data.memberType);
      } catch (error) {
        console.error("회원 정보 조회 실패:", error);
      }
    };

    fetchMemberInfo();
  }, []);

  // 연필 버튼 클릭
  // 추후 이름 변경 모달 연결 예정
  const handleEditClick = () => {
    console.log("이름 변경 모달 열기");
  };

  // 메뉴 페이지로 돌아가기
  const handleMenuNavigate = () => {
    navigate("/menu");
  };

  return (
    <div className="settingsContainer">
      <div className="settings-content">

        {/* 닫기 버튼 */}
        <button
          type="button"
          className="settings-close"
          onClick={() => navigate(-1)}
          aria-label="닫기"
        >
          <span></span>
          <span></span>
        </button>

        {/* 제목 */}
        <header className="settings-header">
          <p>설정을 변경해보세요.</p>
          <h1>SETTINGS</h1>
        </header>

        {/* 회원 정보 */}
        <section className="settings-section information-section">
          <h3>
            회원 정보 <span>Member Information</span>
          </h3>

          <div className="member-info-card">

            <div className="member-icon">
              <FaUser />
            </div>

            <div className="member-name">
              <strong>{userName}</strong>
              <span>{userType}</span>
            </div>

          </div>
        </section>

        {/* 회원 설정 */}
        <section className="settings-section setting-section">
          <h3>
            회원 설정 <span>Member Settings</span>
          </h3>

          <div className="member-settings-card">

            {/* 이름 */}
            <div className="setting-item">
              <label>
                이름 <span>Name</span>
              </label>

              <div className="setting-value-row">

                <span className="setting-value">
                  {userName}
                </span>

                <button
                  type="button"
                  className="edit-button"
                  onClick={handleEditClick}
                  aria-label="이름 변경"
                >
                  <FaPen />
                </button>

              </div>

              <p className="name-description">
                ⓘ WAPS에 쓰이는 이름은 반드시 본명으로 설정해주세요!
              </p>
            </div>

            {/* 회원 구분 */}
            <div className="setting-item member-type">
              <label>
                회원 구분 <span>Member Type</span>
              </label>

              <div className="member-type-value">
                {userType}
              </div>
            </div>

          </div>
        </section>

        {/* 메뉴 페이지 */}
        <button
          type="button"
          className="back-menu-button"
          onClick={handleMenuNavigate}
        >
          메뉴 페이지로 돌아가기
        </button>

      </div>
    </div>
  );
};

export default Settings;