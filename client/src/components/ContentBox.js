import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ContentBox = () => {
  const [projects, setProjects] = useState([]);
  const [isMounted, setIsMounted] = useState(false); // 일정 시간 후 마운트될 상태
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear(); // 현재 연도 가져오기
  const apiUrl = `${process.env.REACT_APP_API_BASE_URL_PROXY}/api/project/list?semester=2&projectYear=${currentYear}`;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsMounted(true); // 일정 시간 후에 마운트 상태 변경
    }, 700); // 3초 후에 마운트 상태 변경 (3000ms)

    // API 호출 함수
    const fetchData = async () => {
      try {
        const response = await axios.get(apiUrl);
        console.log("API 응답 데이터:", response.data);

        if (Array.isArray(response.data.projectsResponse)) {
          setProjects(response.data.projectsResponse);
        } else {
          console.error(
            "API 응답의 projectsResponse가 배열이 아닙니다:",
            response.data
          );
        }
      } catch (error) {
        console.error("데이터 가져오는 중 오류 발생:", error);
      }
    };

    fetchData(); // API 호출

    // 클린업 함수: 컴포넌트 언마운트 시 타임아웃 정리
    return () => clearTimeout(timeoutId);
  }, [currentYear]); // currentYear가 변경될 때마다 fetchData 호출

  if (!isMounted) {
    return (
      <div style={{ textAlign: "center", marginTop: "1rem" }}>로딩 중...</div>
    ); // 일정 시간 후 컴포넌트가 마운트되지 않으면 로딩 표시
  }

  return (
    <div className="content-box mount1">
      {Array.isArray(projects) && projects.length > 0 ? (
        projects.map((project) => (
          <div
            key={project.projectId}
            className="box"
            onClick={() =>
              navigate({ pathname: `/project/${project.projectId}` }, 500)
            }
          >
            <div className="image">
              {project.thumbnail && (
                <img
                  className="project-image"
                  alt={project.title}
                  src={project.thumbnail}
                />
              )}
            </div>
            <div className="titlebox">
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
            </div>
          </div>
        ))
      ) : (
        <p>프로젝트 데이터를 불러오는 중입니다...</p>
      )}
    </div>
  );
};

export default ContentBox;
