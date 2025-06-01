import React, { useState } from "react";
import Header from "../components/Header";
import WAPlogo from "../assets/img/WAP_white_NoBG.png";
import styles from "../assets/RoleSelect.module.css";
import style from "../assets/ProjectCreation/ProjectForm.module.css";

const RoleSelectPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  return (
    <div>
      <Header toggleMenu={toggleMenu} />
      <main>
        <div className={styles.role_select_form}>
          <div className={styles.question}>
            <img
              style={{
                width: 80,
              }}
              src={WAPlogo}
            ></img>
            <div className={styles.text}>회원이신가요?</div>
          </div>
          <div className={styles.btn_group}>
            <button
              type="submit"
              className={style.submit_button}
              style={{
                width: 100,
                marginTop: "20px",
                marginBottom: "100px",
                cursor: "pointer",
              }}
            >
              예
            </button>
            <button
              type="submit"
              className={style.submit_button}
              style={{
                width: 100,
                marginTop: "20px",
                marginBottom: "100px",
                cursor: "pointer",
              }}
            >
              아니오
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleSelectPage;
