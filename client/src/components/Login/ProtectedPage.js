import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const ProtectedPage = () => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = Cookies.get("authToken");
      if (!token) {
        console.error("No token found. Redirecting to login...");
        window.location.href = "/login";
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL_PROXY}/api/user/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUserInfo(response.data);
        console.log("User info received:", response.data);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        window.location.href = "/login";
      }
    };

    fetchUserInfo();
  }, []);

  if (!userInfo) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h2>사용자 정보</h2>
      <p>이름: {userInfo.name}</p>
      <p>이메일: {userInfo.email}</p>
    </div>
  );
};

export default ProtectedPage;
