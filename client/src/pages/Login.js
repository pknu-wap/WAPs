import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import styles from "../assets/Account.module.css";
import wapsLogo from "../assets/img/waps_logo.png";
import kakaoLogo from "../assets/img/pngwing.com.png";
import authStorage from "../utils/authStorage";

export default function Login() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(authStorage.get("authToken"));

  const handleKakaoLogin = (event) => {
    event.preventDefault();
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/oauth/callback`,
    );
    window.location.href = authApi.getKakaoLoginUrl(redirectUri);
  };

  const handleLogout = () => {
    authStorage.remove("authToken");
    authStorage.remove("userName");
    authStorage.remove("userRole");
    authStorage.remove("lastPage");
    navigate("/login", { replace: true });
  };

  return (
    <main className={styles.page}>
      <button
        type="button"
        className={styles.closeButton}
        aria-label="로그인 닫기"
        onClick={() => navigate("/ProjectPage")}
      >
        ×
      </button>
      <div className={`${styles.content} ${styles.loginContent}`}>
        <header className={`${styles.header} ${styles.loginHeader}`}>
          <h1 className={styles.eyebrow}>SIGN IN</h1>
          <img src={wapsLogo} alt="WAPs" className={styles.logo} />
        </header>
        {isLoggedIn ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleLogout}
          >
            로그아웃
          </button>
        ) : (
          <form className={styles.loginForm} onSubmit={handleKakaoLogin}>
            <p className={styles.loginPrompt}>
              카카오로 간편하게 로그인을 진행하세요
              <span>Sign in with KAKAO</span>
            </p>
            <div className={styles.providerOption}>
              <img src={kakaoLogo} alt="" />
              <span>KAKAO</span>
            </div>
            <button type="submit" className={styles.primaryButton}>
              로그인
            </button>
            <button
              type="button"
              className={styles.guestLink}
              onClick={() => navigate("/")}
            >
              로그인 없이 계속하기
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
