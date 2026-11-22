import { REQUIRED_VOTE_COUNT } from "../../constants/vote";
import React from "react";
import styles from "../../assets/ProjectVote.module.css";

const VoteProjectList = ({
  projects,
  selectedProjects,
  setSelectedProjects,
  isVotedUser,
}) => {
  const handleProjectSelect = (participants, isVotedUser) => {
    // console.log("클릭됨", participants);

    if (isVotedUser) {
      alert("투표는 변경하실 수 없습니다.");
      return;
    }
    if (selectedProjects.includes(participants)) {
      // 이미 선택된 프로젝트는 해제
      setSelectedProjects(selectedProjects.filter((id) => id !== participants));
    } else {
      // 선택 가능한 개수 미만일 때만 추가
      if (selectedProjects.length < REQUIRED_VOTE_COUNT) {
        setSelectedProjects([...selectedProjects, participants]);
      } else {
        alert(`${REQUIRED_VOTE_COUNT}개의 프로젝트만 선택할 수 있습니다.`); // 사용자에게 알림
      }
    }
  };

  return (
    <div className={styles.project_list_form}>
      {Array.isArray(projects) && projects.length > 0 ? (
        projects.map((project, index) => {
          const isSelected = selectedProjects.includes(project.participants);

          return (
            <div
              key={project.participants}
              className={`${styles.project_list_box} ${
                isSelected ? styles.selected : ""
              }`}
              onClick={() =>
                handleProjectSelect(project.participants, isVotedUser)
              }
            >
              <div className={styles.inform_box}>
                <div style={{ fontSize: 15, position: "absolute", zIndex: 2 }}>
                  {index + 1}
                </div>
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
        <p>투표에 참여하는 프로젝트가 없습니다.</p>
      )}
    </div>
  );
};

export default VoteProjectList;
