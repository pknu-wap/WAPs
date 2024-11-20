import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // URL에서 authorization_code 추출
      const params = new URLSearchParams(window.location.search);
      const authorizationCode = params.get("code");

      if (!authorizationCode) {
        alert("로그인에 실패했습니다. 다시 시도해 주세요.");
        console.error("Authorization code not found in URL.");
        navigate("/login");
        return;
      }

      console.log("Authorization code received:", authorizationCode);

      try {
        // 백엔드로 authorization_code 전달
        const response = await axios.post(
          "http://15.164.98.72:8080/oauth2/token", // 백엔드에서 처리할 엔드포인트
          {
            code: authorizationCode,
            redirect_uri: "http://15.164.98.72:8080/oauth2/callback/kakao", // 리다이렉트 URI와 일치해야 함
          }
        );

        // 토큰 응답 처리
        const { accessToken } = response.data;
        Cookies.set("authToken", accessToken, { expires: 7 });

        console.log("Token saved in cookies. Redirecting to main page...");
        navigate("/");
      } catch (error) {
        console.error("Error during token exchange:", error);
        alert("로그인 처리 중 문제가 발생했습니다.");
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div>
      <h2>로그인 처리 중...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
};

export default Callback;
