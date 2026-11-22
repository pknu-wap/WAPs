import { useEffect, useState } from "react";
import { userApi } from "../api/user";
import authStorage from "../utils/authStorage";

export default function useCurrentUserName() {
  const [name, setName] = useState(() => authStorage.get("userName") || "");
  useEffect(() => {
    let active = true;
    let revision = 0;
    const read = () => {
      revision++;
      setName(authStorage.get("authToken") ? authStorage.get("userName") || "" : "");
    };
    const refresh = async () => {
      read();
      const token = authStorage.get("authToken");
      if (!token) return;
      const request = revision;
      try {
        const profile = await userApi.getMe();
        if (!active || request !== revision || token !== authStorage.get("authToken")) return;
        if (typeof profile.userName === "string" && profile.userName.trim()) {
          authStorage.set("userName", profile.userName, { expires: 7 });
          setName(profile.userName);
        }
      } catch {
        // 일시적인 조회 실패 시 마지막으로 확인한 이름을 유지한다.
      }
    };
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const changedInAnotherTab = (event) => {
      if (event.key === "waps.profileChanged") refresh();
    };
    window.addEventListener("waps:authChanged", read);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", changedInAnotherTab);
    document.addEventListener("visibilitychange", visible);
    refresh();
    return () => {
      active = false;
      window.removeEventListener("waps:authChanged", read);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", changedInAnotherTab);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return name;
}
