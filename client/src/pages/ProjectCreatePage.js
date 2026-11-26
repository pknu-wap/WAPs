import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { projectApi } from "../api/project";
import Cookies from "../utils/authStorage";
import Header from "../components/Header";
import Menu from "../components/Menu";
import ProjectFormNew from "../components/ProjectCreation/ProjectFormNew";
import FloatingButton from "../components/FloatingButton";
import LoadingPage from "../components/LoadingPage";

const ProjectCreatePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const token = Cookies.get("authToken");
  const isEditMode = Boolean(projectId);
  const toggleMenu = () => setMenuOpen((open) => !open);

  useEffect(() => {
    if (!token) {
      alert("글 작성은 로그인 후에 가능합니다.");
      navigate("/login", { replace: true });
      return;
    }
    if (!projectId) {
      setResult(null);
      return;
    }

    let active = true;
    setResult(null);
    projectApi
      .getprojectUpdatePage(projectId)
      .then((data) => {
        if (active) setResult({ projectId, data });
      })
      .catch(() => {
        if (active)
          setResult({
            projectId,
            error:
              "프로젝트 정보를 불러오지 못했습니다. 권한과 연결 상태를 확인하고 다시 시도해주세요.",
          });
      });
    return () => {
      active = false;
    };
  }, [projectId, navigate, token, revision]);

  if (!token) return null;
  if (isEditMode && result?.projectId !== projectId) return <LoadingPage />;

  return (
    <div>
      <Header toggleMenu={toggleMenu} />
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      {isEditMode && result.error ? (
        <div>
          <p role="alert">{result.error}</p>
          <button
            type="button"
            onClick={() => setRevision((value) => value + 1)}
          >
            다시 시도
          </button>
        </div>
      ) : (
        <ProjectFormNew
          key={projectId || "create"}
          isEdit={isEditMode}
          existingProject={isEditMode ? result.data : null}
        />
      )}
      <FloatingButton />
    </div>
  );
};

export default ProjectCreatePage;
