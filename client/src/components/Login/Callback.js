import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import authStorage, { clearDevSession } from "../../utils/authStorage";
import { userApi } from "../../api/user";
import LoadingPage from "../LoadingPage";
import { registrationRequired } from "../../utils/accountProfile";

export default function Callback() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const request = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    if (!token || params.get("code") === "AUTH_OAUTH2_FAILURE") {
      navigate("/login", { replace: true });
      return undefined;
    }
    if (request.current?.token !== token) {
      clearDevSession();
      authStorage.set("authToken", token, { expires: 7 });
      request.current = {
        token,
        promise: Promise.all([userApi.getMe(), userApi.getRole().catch(() => null)]),
      };
    }
    let active = true;
    request.current.promise.then(([profile, role]) => {
      if (!active) return;
      authStorage.set("userName", profile.userName, { expires: 7 });
      if (role?.role) authStorage.set("userRole", role.role, { expires: 7 });
      else authStorage.remove("userRole");
      authStorage.set("lastPage", "/", { expires: 7 });
      navigate(registrationRequired(profile) === false ? "/ProjectPage" : "/signup", { replace: true });
    }).catch(() => {
      if (active) {
        authStorage.remove("authToken");
        authStorage.remove("userName");
        authStorage.remove("userRole");
        navigate("/login", { replace: true });
      }
    });
    return () => { active = false; };
  }, [navigate, search]);
  return <LoadingPage />;
}
