import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import NameChange from "../components/NameChange";
import { userApi } from "../api/user";
import authStorage from "../utils/authStorage";
import { memberTypeLabel } from "../utils/accountProfile";
import wapsLogo from "../assets/img/waps_logo.png";
import "../assets/Settings.css";

const Settings = () => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNameSaved, setIsNameSaved] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const data = await userApi.getMe();
        if (!active) return;

        setUserName(data?.name ?? data?.userName ?? "");
        setUserType(memberTypeLabel(data));
      } catch (error) {
        if (active) setLoadError("회원 정보를 불러오지 못했습니다.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchUserInfo();
    return () => { active = false; };
  }, [reload]);

  const handleEditClick = () => {
    setIsNameModalOpen(true);
  };

  const handleNameChange = async (newName) => {
    if (isSavingName) return;
    const trimmedName = newName.trim();

    if (!trimmedName || trimmedName.length > 4) {
      alert("이름은 1자 이상 4자 이하로 입력해주세요.");
      return;
    }

    setIsSavingName(true);
    try {
      const data = await userApi.updateName(trimmedName);
      const savedName = data?.userName ?? data?.name;
      if (typeof savedName !== "string" || !savedName.trim())
        throw new Error("Missing saved name");

      setUserName(savedName);
      authStorage.set("userName", savedName, { expires: 7 });
      setIsNameSaved(true);
      setIsNameModalOpen(false);
    } catch (error) {
      console.error("이름 변경 실패:", error);
      alert("이름 변경에 실패했습니다.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleMenuNavigate = () => {
    sessionStorage.setItem("openMenuAfterBack", "true");
    navigate("/ProjectPage");
  };

  return (
    <div className="settingsContainer">
      <button
        type="button"
        className="settings-brand"
        onClick={() => navigate("/ProjectPage")}
        aria-label="WAPs 프로젝트 페이지"
      >
        <img src={wapsLogo} alt="WAPs" />
      </button>
      <button
        type="button"
        className="settings-close"
        onClick={() => navigate(-1)}
        aria-label="닫기"
      >
        <span />
        <span />
      </button>

      <div className="settings-content">
        <header className="settings-header">
          <p>설정을 변경해보세요.</p>
          <h1>SETTINGS</h1>
        </header>
        {loadError && (
          <p role="alert">
            {loadError}{" "}
            <button type="button" onClick={() => setReload((value) => value + 1)}>
              다시 불러오기
            </button>
          </p>
        )}

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
                  disabled={isLoading || Boolean(loadError) || isSavingName}
                >
                  <FiEdit2 />
                </button>
              </div>

              <p className="name-description">
                ⓘ WAPs에 쓰이는 이름은 별명이 아닌 본명으로 설정해주세요!
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

        <div className="settings-actions">
          <button
            type="button"
            className={`settings-action settings-action--secondary${isNameSaved ? " settings-action--saved" : ""}`}
            onClick={handleMenuNavigate}
          >
            메뉴 페이지로 돌아가기
          </button>
        </div>
      </div>

      {isNameModalOpen && (
        <NameChange
          currentName={userName}
          isSaving={isSavingName}
          onClose={() => setIsNameModalOpen(false)}
          onChangeName={handleNameChange}
        />
      )}
    </div>
  );
};

export default Settings;
