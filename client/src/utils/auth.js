import axios from "axios";
import Cookies from "js-cookie";

export const isAuthenticated = async () => {
  const token = Cookies.get("authToken");
  if (!token) return false;

  try {
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
