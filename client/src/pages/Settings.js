import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaPen } from "react-icons/fa";
import NameChange from "../components/NameChange";
import PageBrand from "../components/PageBrand";
import { userApi } from "../api/user";
import authStorage from "../utils/authStorage";
import { memberTypeLabel } from "../utils/accountProfile";
import "../assets/Settings.css";

const Settings = () => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchUserInfo = async () => {
      const token = authStorage.get("authToken");
      try {
        setIsLoading(true);
        setLoadError("");

        const data = await userApi.getMe();
        if (!active || token !== authStorage.get("authToken")) return;

        setUserName(data?.name ?? data?.userName ?? "");
        const currentName = data?.name ?? data?.userName;
        if (typeof currentName === "string" && currentName.trim()) {
          authStorage.set("userName", currentName, { expires: 7 });
        }
        setUserType(memberTypeLabel(data));
      } catch (error) {
        if (active) setLoadError("회원 정보를 불러오지 못했습니다.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchUserInfo();
    return () => {
      active = false;
    };
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
      <PageBrand />
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
        {loadError && (
          <p role="alert">
            {loadError}{" "}
            <button
              type="button"
              onClick={() => setReload((value) => value + 1)}
            >
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
                  <FaPen />
                </button>
              </div>

              <p className="name-description">
                ⓘ WAPs에 쓰이는 이름은 반드시 본명으로 설정해주세요!
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
          className="settings-action settings-action--primary"
          disabled={isLoading || Boolean(loadError) || isSavingName}
          onClick={() => navigate("/signup?edit=true")}
        >
          회원가입 정보 수정
        </button>
        <button
          type="button"
          className="back-menu-button"
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
