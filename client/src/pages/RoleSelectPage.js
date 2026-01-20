import React from "react";
import styles from "../assets/RoleSelect.module.css";
import { userApi } from "../api/user";
import { useNavigate } from "react-router-dom";

const RoleSelectPage = () => {
  const navigate = useNavigate();

  const handleSelectRole = async (role) => {
    try {
      await userApi.selectRole(role);
      navigate("/ProjectPage");
    } catch (error) {
      console.error("역할 선택 실패:", error);
      alert("역할 선택에 실패했습니다.");
    }
  };

  return (
    <div className={styles.mainContainer}>
      <button
        className={styles.closeButton}
        onClick={() => navigate("/ProjectPage")}
      >
        &times;
      </button>

      <div className={styles.roleSelectForm}>
        <div className={styles.question}>WAP 회원이신가요?</div>

        <div className={styles.btnGroup}>
          <button
            type="button"
            className={styles.roleButton}
            onClick={() => handleSelectRole("member")}
          >
            예
          </button>
          <button
            type="button"
            className={styles.roleButton}
            onClick={() => handleSelectRole("guest")}
          >
            아니오
          </button>
        </div>

        <div
          className={styles.alreadySelected}
          onClick={() => navigate("/ProjectPage")}
        >
          이미 선택했습니다.
        </div>
      </div>
    </div>
  );
};

export default RoleSelectPage;
