import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ContentBox = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear(); // 현재 연도 가져오기

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://15.164.98.72:8080/project/list?semester=2&projectYear=${currentYear}`
        );

        // 응답 데이터를 콘솔에 출력하여 형식을 확인
        console.log("API 응답 데이터:", response.data);

        // projectsResponse에 배열이 포함되어 있는지 확인 후 설정
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

    fetchData();
  }, [currentYear]); // currentYear가 변경될 때마다 fetchData 호출

  return (
    <div className="content-box">
      {Array.isArray(projects) && projects.length > 0 ? (
        projects.map((project) => (
          <div
            key={project.projectId}
            className="box"
            onClick={() =>
              navigate({ pathname: `/project/${project.projectId}` })
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
