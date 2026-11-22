import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import authStorage, { clearDevSession } from "../../utils/authStorage";
import { userApi } from "../../api/user";
import LoadingPage from "../LoadingPage";

export default function Callback() {
  const navigate = useNavigate();
  const request = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token || params.get("code") === "AUTH_OAUTH2_FAILURE") {
      navigate("/login", { replace: true });
      return undefined;
    }
    if (!request.current) {
      clearDevSession();
      authStorage.set("authToken", token, { expires: 7 });
      request.current = Promise.all([userApi.getMe(), userApi.getRole()]);
    }
    let active = true;
    request.current.then(([profile, role]) => {
      if (!active) return;
      authStorage.set("userName", profile.userName, { expires: 7 });
      authStorage.set("userRole", role.role, { expires: 7 });
      authStorage.set("lastPage", "/", { expires: 7 });
      navigate(profile.signupCompleted ? "/ProjectPage" : "/select/role", { replace: true });
    }).catch(() => {
      if (active) {
        authStorage.remove("authToken");
        navigate("/login", { replace: true });
      }
    });
    return () => { active = false; };
  }, [navigate]);
  return <LoadingPage />;
}
