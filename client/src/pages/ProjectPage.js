import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Header from "../components/Header";
import Menu from "../components/Menu";
import ProjectFormNew from "../components/ProjectCreation/ProjectFormNew";
import FloatingButton from "../components/FloatingButton";
// 프로젝트 생성 및 수정 페이지 (조건분 렌더링)

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = Boolean(projectId); // projectId가 있으면 수정 모드

  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    if (isEditMode) {
      // 수정 모드일 경우, 프로젝트 데이터를 가져옵니다.
      const fetchProjectDetails = async () => {
        const token = Cookies.get("authToken");
        if (!token) {
          alert("로그인이 필요합니다.");
          navigate("/login");
          return;
        }

        setIsLoading(true);

        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL_PROXY}/api/project/${projectId}/update`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setProjectData(response.data);

          // 가져온 데이터 표시
          console.log("프로젝트 상세 정보:", response.data);
        } catch (error) {
          console.error("프로젝트 상세 정보 가져오기 실패:", error);
          alert("프로젝트 정보를 가져오는 데 실패했습니다.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchProjectDetails();
    }
  }, [isEditMode, projectId, navigate]);

  const handleSubmit = async (projectData) => {
    const token = Cookies.get("authToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    const apiUrl = `${process.env.REACT_APP_API_BASE_URL_PROXY}/api/project${
      isEditMode ? `/${projectId}` : ""
    }`;

    const method = isEditMode ? "put" : "post";

    try {
      await axios({
        method,
        url: apiUrl,
        data: projectData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert(`프로젝트가 성공적으로 ${isEditMode ? "수정" : "생성"}되었습니다.`);
      navigate("/projects"); // 프로젝트 리스트 페이지로 이동
    } catch (error) {
      console.error(`${isEditMode ? "수정" : "생성"} 실패:`, error);
      alert(
        `프로젝트 ${
          isEditMode ? "수정" : "생성"
        }에 실패했습니다. 다시 시도해 주세요.`
      );
    }
  };

  if (isEditMode && isLoading) return <div>로딩 중...</div>;

  return (
    <div>
      <Header toggleMenu={toggleMenu} />
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <ProjectFormNew
        isEdit={isEditMode}
        existingProject={isEditMode ? projectData : null}
        onSubmit={handleSubmit}
      />
      {/* <FloatingButton /> */}
    </div>
  );
};

export default ProjectPage;
