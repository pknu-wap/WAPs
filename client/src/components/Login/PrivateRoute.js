import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Cookies from "js-cookie";

const PrivateRoute = () => {
  const token = Cookies.get('authToken'); // 쿠키에서 토큰 가져오기

  if (!token) {
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    return <Navigate to="/login" />;
  }

  // 토큰이 있으면 보호된 경로 렌더링
  return <Outlet />;
};

export default PrivateRoute;
