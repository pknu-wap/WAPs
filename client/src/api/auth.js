import apiClient from "./client";

export const authApi = {
  // 토큰 유효성 검증
  verifyToken: () => apiClient.get("/oauth2/authorization/kakao"),

  // 카카오 로그인 URL 생성 
  getKakaoLoginUrl: (redirectUri) => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    return `${baseUrl}/oauth2/authorization/kakao?redirect_uri=${redirectUri}`;
  }
};