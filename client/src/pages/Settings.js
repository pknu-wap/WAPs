import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaPen } from "react-icons/fa";
import NameChange from "../components/NameChange";
import { userApi } from "../api/user";
import "../assets/Settings.css";

const Settings = () => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true);

        const data = await userApi.getMe();

        setUserName(data?.name ?? "");
        setUserType(data?.memberType ?? "");
      } catch (error) {
        console.error("회원 정보 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleEditClick = () => {
    setIsNameModalOpen(true);
  };

  const handleNameChange = async (newName) => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      alert("이름을 입력해주세요.");
      return;
    }

    try {
      const data = await userApi.updateName(trimmedName);

      setUserName(data?.name ?? trimmedName);
      setIsNameModalOpen(false);
    } catch (error) {
      console.error("이름 변경 실패:", error);
      alert("이름 변경에 실패했습니다.");
    }
  };

  const handleMenuNavigate = () => {
    sessionStorage.setItem("openMenuAfterBack", "true");
    navigate("/ProjectPage");
  };

  return (
    <div className="settingsContainer">
      <div className="settings-content">
        <button
          type="button"
          className="settings-close"
          onClick={() => navigate(-1)}
          aria-label="닫기"
        >
          <span />
          <span />
        </button>

        <header className="settings-header">
          <p>설정을 변경해보세요.</p>
          <h1>SETTINGS</h1>
        </header>

        <section className="settings-section information-section">
          <h3>
            회원 정보 <span>Member Information</span>
          </h3>

          <div className="member-info-card">
            <div className="member-icon">
              <FaUser />
            </div>

            <div className="member-name">
              {isLoading ? (
                <span>불러오는 중...</span>
              ) : (
                <>
                  <strong>{userName}</strong>
                  <span>{userType}</span>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="settings-section setting-section">
          <h3>
            회원 설정 <span>Member Settings</span>
          </h3>

          <div className="member-settings-card">
            <div className="setting-item">
              <label>
                이름 <span>Name</span>
              </label>

              <div className="setting-value-row">
                <span className="setting-value">
                  {isLoading ? "불러오는 중..." : userName}
                </span>

                <button
                  type="button"
                  className="edit-button"
                  onClick={handleEditClick}
                  aria-label="이름 변경"
                  disabled={isLoading}
                >
                  <FaPen />
                </button>
              </div>

              <p className="name-description">
                ⓘ WAPS에 쓰이는 이름은 반드시 본명으로 설정해주세요!
              </p>
            </div>

            <div className="setting-item member-type">
              <label>
                회원 구분 <span>Member Type</span>
              </label>

              <div className="member-type-value">
                {isLoading ? "불러오는 중..." : userType}
              </div>
            </div>
          </div>
        </section>

        <button
          type="button"
          className="back-menu-button"
          onClick={handleMenuNavigate}
        >
          메뉴 페이지로 돌아가기
        </button>
      </div>

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