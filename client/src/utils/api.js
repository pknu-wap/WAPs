import axios from 'axios';
import Cookies from 'js-cookie';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: 'http://15.164.98.72:8080', // 백엔드 API 기본 URL
  timeout: 5000, // 요청 타임아웃 설정
});

// 요청 인터셉터 설정
apiClient.interceptors.request.use(
  (config) => {
    // 쿠키에서 토큰 가져오기
    const token = Cookies.get('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Authorization 헤더에 토큰 추가
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
