import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingPage from "../LoadingPage";
import authStorage, { clearDevSession } from "../../utils/authStorage";

const apiBaseUrl =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

async function fetchAccount(path, token) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch account");
  return response.json();
}

export default function Callback() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const hasHandled = useRef(false);

  useEffect(() => {
    if (hasHandled.current) return;
    hasHandled.current = true;

    const params = new URLSearchParams(search);
    const token = params.get("token");
    if (!token || params.get("code") === "AUTH_OAUTH2_FAILURE") {
      alert("카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
      navigate("/login", { replace: true });
      return;
    }

    Promise.all([
      fetchAccount("/user/me", token),
      fetchAccount("/user/role", token),
    ])
      .then(([profile, { role }]) => {
        clearDevSession();
        const options = { expires: 7 };
        authStorage.set("userName", profile.userName, options);
        authStorage.set("authToken", token, options);
        authStorage.set("lastPage", "/", options);
        if (role) authStorage.set("userRole", role, options);
        else authStorage.remove("userRole");

        let destination = "/ProjectPage";
        if (profile.registrationRequired === true) {
          destination = "/signup";
        }
        navigate(destination, { replace: true });
      })
      .catch(() => {
        alert("사용자 정보를 가져오는 중 오류가 발생했습니다.");
        navigate("/login", { replace: true });
      });
  }, [navigate, search]);

  return <LoadingPage />;
}
