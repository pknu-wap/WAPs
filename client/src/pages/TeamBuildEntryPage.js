import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { teamBuildApi } from "../api/team-build";
import LoadingPage from "../components/LoadingPage";

function TeamBuildEntryPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchRole = async () => {
      try {
        const response = await teamBuildApi.getRole();
        const role = response?.role;
        if (!active) return;
        if (role === "leader") {
          navigate("/team-build/recruit", { replace: true });
        } else {
          navigate("/team-build/projects", { replace: true });
        }
      } catch (err) {
        if (!active) return;
        setError("팀빌딩 정보를 불러오지 못했습니다. 다시 시도해주세요.");
      }
    };

    fetchRole();
    return () => {
      active = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <div style={{ padding: "40px 16px", textAlign: "center" }}>
        <div style={{ color: "#fff", marginBottom: "12px" }}>{error}</div>
        <button type="button" onClick={() => window.location.reload()}>
          다시 시도
        </button>
      </div>
    );
  }

  return <LoadingPage />;
}

export default TeamBuildEntryPage;
