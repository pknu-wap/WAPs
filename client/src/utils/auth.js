import axios from "axios";
import Cookies from "js-cookie";

export const isAuthenticated = async () => {
  const token = Cookies.get("authToken");
  if (!token) return false;

  try {
    // 토큰 유효성 확인을 위해 백엔드 호출
    await axios.get("http://15.164.98.72:8080/oauth2/authorization/kakao", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return true;
  } catch (error) {
    console.error("Invalid or expired token:", error);
    return false;
  }
};