import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "../../assets/Vote/ProjectVote.module.css";

const VoteProjectList = ({
  handleProjectSelect,
  selectedProjects,
  setSelectedProjects,
}) => {
  const [projects, setProjects] = useState([]);
  const currentYear = new Date().getFullYear(); // 현재 연도 가져오기
  const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/project/list?semester=2&projectYear=${currentYear}`;

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
        // console.error("데이터 가져오는 중 오류 발생:", error);
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
              className={`${styles.project_list_box} ${
                isSelected ? styles.selected : ""
              }`}
              onClick={() => handleProjectSelect(project.projectId)}
            >
              <div className={styles.inform_box}>
                <div style={{ marginTop: 10, fontSize: 18 }}>{index + 1}</div>
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
                    className={`${styles.title} ${
                      isSelected ? styles.selected_title : ""
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
