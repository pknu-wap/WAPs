import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "../../assets/ProjectVote.module.css";

const VoteProjectList = ({
  // handleProjectSelect,
  selectedProjects,
  setSelectedProjects,
  isVotedUser,
}) => {
  const [projects, setProjects] = useState([]);
  const currentYear = new Date().getFullYear(); // 현재 연도 가져오기
  // 날짜 체크 : 음....... 이거 월 설정을 어떻게 하면 좋을까납..?
  const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/project/list?semester=1&projectYear=${currentYear}`;

  const handleProjectSelect = (projectId, isVotedUser) => {
    // console.log("클릭됨", projectId);

    if (isVotedUser) {
      alert("투표는 변경하실 수 없습니다.");
      return;
    }
    if (selectedProjects.includes(projectId)) {
      // 이미 선택된 프로젝트는 해제
      setSelectedProjects(selectedProjects.filter((id) => id !== projectId));
    } else {
      // 선택된 프로젝트가 3개일 때만 추가
      if (selectedProjects.length < 3) {
        setSelectedProjects([...selectedProjects, projectId]);
      } else {
        alert("3개의 프로젝트만 선택할 수 있습니다."); // 사용자에게 알림
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(apiUrl);

        // console.log("API 응답 데이터:", response.data);

        if (Array.isArray(response.data.projectsResponse)) {
          setProjects(response.data.projectsResponse);
        } else {
          // console.error(
          //   "API 응답의 projectsResponse가 배열이 아닙니다:",
          //   response.data
          // );
        }
      } catch (error) {
        console.error("데이터 가져오는 중 오류 발생:", error);
      }
    };

    fetchData();
  }, [currentYear]);

  return (
    <div className={styles.project_list_form}>
      {Array.isArray(projects) && projects.length > 0 ? (
        projects.map((project, index) => {
          const isSelected = selectedProjects.includes(project.projectId);

          return (
            <div
              key={project.projectId}
              className={`${styles.project_list_box} ${isSelected ? styles.selected : ""
                }`}
              onClick={() =>
                handleProjectSelect(project.projectId, isVotedUser)
              }
            >
              <div className={styles.inform_box}>
                <div style={{ fontSize: 15, position: "absolute", zIndex: 2}}>{index + 1}</div>
                {project.thumbnail && (
                  <div className={styles.project_thumbnail}>
                    <img
                      className={styles.thumbnail_image}
                      alt={project.title}
                      src={project.thumbnail}
                    />
                  </div>
                )}

                <div className={styles.project_title_form}>
                  <h2
                    className={`${styles.title} ${isSelected ? styles.selected_title : ""
                      }`}
                  >
                    {project.title}
                  </h2>
                  <p className={styles.summary}>{project.summary}</p>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <p>프로젝트 데이터를 불러오는 중입니다...</p>
      )}
    </div>
  );
};

export default VoteProjectList;