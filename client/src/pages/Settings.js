import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "../utils/authStorage";
import { FaUser, FaPen } from "react-icons/fa";
import NameChange from "../components/NameChange";
import "../assets/Settings.css";

const Settings = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        const token = Cookies.get("authToken");
      
        if (!token) {
          console.error("authToken이 없습니다.");
          return;
        }

        const response = await fetch("/api/member", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `회원 정보 조회 실패: ${response.status}`
          );
        }

        const data = await response.json();

        console.log("회원 정보:", data);

        if (data.name) {
          setUserName(data.name);
        } else {
        
          const kakaoUserName = Cookies.get("userName");

          if (kakaoUserName) {
            setUserName(kakaoUserName);
          }
        }

        // 회원 구분
        if (data.memberType) {
          setUserType(data.memberType);
        }

      } catch (error) {
        console.error("회원 정보 조회 실패:", error);
      }
    };

    fetchMemberInfo();
  }, []);

  const handleEditClick = () => {
    setIsNameModalOpen(true);
  };

  //이름변경
  const handleNameChange = async (newName) => {
    try {
      const token = Cookies.get("authToken");

      if (!token) {
        alert("로그인 정보가 없습니다.");
        return;
      }

      const response = await fetch("/api/member/name", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: newName,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "이름 변경 API 오류:",
          response.status,
          errorText
        );

        throw new Error(
          `이름 변경 실패: ${response.status}`
        );
      }

      setUserName(newName);

      if (Cookies.set) {
        Cookies.set("userName", newName);
      }

      setIsNameModalOpen(false);

      console.log("이름 변경 성공:", newName);

    } catch (error) {
      console.error("이름 변경 실패:", error);

      alert("이름 변경에 실패했습니다.");
    }
  };

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


        {/* 메뉴 페이지로 돌아가기 */}
        <button
          type="button"
          className="back-menu-button"
          onClick={handleMenuNavigate}
        >
          메뉴 페이지로 돌아가기
        </button>

      </div>


      {/* 이름 변경 모달 */}
      {isNameModalOpen && (
        <NameChange
          currentName={userName}
          onClose={() => setIsNameModalOpen(false)}
          onChangeName={handleNameChange}
        />
      )}

    </div>
  );
};

export default Settings;