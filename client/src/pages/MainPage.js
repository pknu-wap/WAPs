import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import Header from "../components/Header";
import Menu from "../components/Menu";
import styles from "../assets/Main/Main.module.css";
import "../assets/transition.css"; // 애니메이션 CSS 추가

const MainPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [inTransition, setInTransition] = useState(false); // 트랜지션 상태 관리
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleButtonClick = () => {
    setInTransition(true); // 트랜지션 시작
    setTimeout(() => navigate("/HomePage"), 400); // 애니메이션 완료 후 이동
  };

  return (
    <CSSTransition
      in={!inTransition} // 트랜지션이 진행 중인지 여부
      timeout={500} // 트랜지션 시간
      classNames="slide" // 애니메이션 클래스명
      unmountOnExit
    >
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
            <div className={styles.caption2}>
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
              onClick={handleButtonClick}
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
    </CSSTransition>
  );
};

export default MainPage;
