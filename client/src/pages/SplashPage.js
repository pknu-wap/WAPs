import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../assets/Splash.module.css";

const SplashPage = () => {
  const navigate = useNavigate();

  return (
    <div className="splash-page">
      <main>
        <div className={styles.mainContainer}>
          <div className={styles.titleBox}>
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
              <p>WAP의 모든 프로젝트들을 둘러보세요</p>
            </div>

            <button
              type="submit"
              className={styles.submit_button}
              onClick={() => navigate("/ProjectPage")}
            >
              <div>PROJECTS</div>
              <svg
                viewBox="0 0 45 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 4H25.5L20.5 0M25.5 4L20.5 8"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SplashPage;
