import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Callback = () => {
  const navigate = useNavigate();

  const fetchUserInfo = (token) => {
    fetch("http://15.164.98.72:8080/user/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch user info.");
        }
        return response.json();
      })
      .then((data) => {
        Cookies.set("userName", data.userName, { expires: 7 });
        Cookies.set("authToken", token, { expires: 7 });
        console.log("사용자 정보:", data);
        navigate("/"); // 메인 페이지로 리다이렉트
      })
      .catch((error) => {
        console.error("사용자 정보를 가져오는 동안 에러 발생:", error);
        alert("사용자 정보를 가져오는 중 오류가 발생했습니다.");
        navigate("/login");
      });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      fetchUserInfo(token); // 로그인 성공 후 사용자 정보 가져오기
    } else {
      alert("인증 코드가 없습니다. 다시 로그인해주세요.");
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div>
      <h2>로그인 처리 중...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
};

export default Callback;
