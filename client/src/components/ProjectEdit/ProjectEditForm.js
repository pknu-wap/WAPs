import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

const ProjectEditPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      const token = Cookies.get("authToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL_PROXY}/api/project/${projectId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProjectData(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("프로젝트 상세 정보 가져오기 실패:", error);
        alert("프로젝트 정보를 가져오는 데 실패했습니다.");
      }
    };

    fetchProjectDetails();
  }, [projectId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 수정된 데이터를 서버로 전송하는 로직을 추가합니다.
  };

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>프로젝트 제목</label>
        <input type="text" defaultValue={projectData.title} />
      </div>
      <div>
        <label>내용</label>
        <textarea defaultValue={projectData.content}></textarea>
      </div>
      <button type="submit">수정 완료</button>
    </form>
  );
};

export default ProjectEditPage;
