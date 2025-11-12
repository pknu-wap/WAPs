import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Callback = () => {
  const navigate = useNavigate();

  const fetchUserInfo = (token) => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/user/me`, {
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

        // 로그인 성공 후 이동한 위치 기억용 쿠키 저장
        Cookies.set("lastPage", "/", { expires: 7 }); // 필요하면 "/" 대신 원하는 경로로 수정

        console.log("사용자 정보:", data);
        alert("로그인에 성공했습니다!"); // alert창 없애기
        // navigate("/"); // 또는 "/mystudy", 등 원하는 경로

        return fetch(`${process.env.REACT_APP_API_BASE_URL}/user/role`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch role info.");
        }
        return response.json();
      })
      .then((roleData) => {
        console.log("역할 정보:", roleData);

        // 역할 정보 저장
        if (roleData.role) {
          Cookies.set("userRole", roleData.role, { expires: 7 });
        }

        if (roleData.roleAssigned) { // 역할을 이미 선택했다면
          navigate("/ProjectPage"); // 홈페이지로
        } else {
          navigate("/select/role");
        }
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
      fetchUserInfo(token);
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