import React, { useState } from "react";
import Header from "../components/Header";
import WAPlogo from "../assets/img/WAP_white_NoBG.png";
import styles from "../assets/RoleSelect.module.css";
import style from "../assets/ProjectCreation/ProjectForm.module.css";
import Cookies from "js-cookie";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RoleSelectPage = () => {
  const token = Cookies.get("authToken");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleSelectRole = async (role) => {
    const url = role === "member" ? "/user/role/member" : "/user/role/guest";

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}${url}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true, // 쿠키 인증이 필요한 경우
        }
      );
      console.log("역할 선택 성공:", response.data);

      navigate("/HomePage");
    } catch (error) {
      console.error("역할 선택 실패:", error);
      alert("역할 선택에 실패했습니다.");
    }
  };

  return (
    <div>
      <Header toggleMenu={toggleMenu} />
      <main>
        <div className={styles.role_select_form}>
          <div className={styles.question}>
            <img style={{ width: 80 }} src={WAPlogo} alt="WAP 로고" />
            <div className={styles.text}>회원이신가요?</div>
          </div>
          <div className={styles.btn_group}>
            <button
              type="button"
              className={style.submit_button}
              onClick={() => handleSelectRole("member")}
              style={{
                width: 100,
                marginTop: "20px",

                cursor: "pointer",
              }}
            >
              예
            </button>
            <button
              type="button"
              className={style.submit_button}
              onClick={() => handleSelectRole("guest")}
              style={{
                width: 100,
                marginTop: "20px",

                cursor: "pointer",
              }}
            >
              아니오
            </button>
          </div>
          <div
            className={styles.already_selected}
            onClick={() => navigate("/HomePage")}
          >
            이미 선택했습니다.
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleSelectPage;
