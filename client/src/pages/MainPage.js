import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Menu from "../components/Menu";
import styles from "../assets/Main/Main.module.css";

const MainPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const navigate = useNavigate();

  return (
    <div className={styles.mainContainer}>
      <Header toggleMenu={toggleMenu} />
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <main>
        <div className={styles.titleBox}>
          <div className={styles.rectangle}></div>
          <div className={styles.title}>
            <p>Why</p>
            <p>Are you</p>
            <p>Programming?</p>
          </div>
          <p className={styles.caption1}>우리는 왜 프로그래밍을 할까요?</p>
          <div className={styles.line}></div>
          <div className={styles.caption2} v>
            <p>WAP은 그 물음에 답하기 위해,</p>
            <p>우리만의 서비스를 개발하기 위해</p>
            <p>창설되었습니다.</p>
            <br />
            <p>WAP이 진행한,</p>
            <p>그리고 하고 있는 프로젝트들을 둘러보세요</p>
          </div>

          <button
            type="submit"
            className={styles.submit_button}
            onClick={() => {
              navigate("/HomePage");
            }}
          >
            <div></div>
            Projects
            <svg
              viewBox="0 0 45 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 1H25.5L19.5 7" stroke="black" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div className={styles.footer}></div>
      </main>
    </div>
  );
};

export default MainPage;
