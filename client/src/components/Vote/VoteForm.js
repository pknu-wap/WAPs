import React from "react";
import dogImage from "../../assets/img/dog.png";
import styles from "../../assets/Vote/ProjectVote.module.css";
import sub_styles from "../../assets/ProjectCreation/ProjectForm.module.css";
import VoteProjectList from "./VoteProjectList";
import useProjectvoteForm from "../../hooks/Projectvote/useProjectVoteForm";
const VoteForm = () => {
  const { selectedProjects, handleProjectSelect, setSelectedProjects } =
    useProjectvoteForm();

  // 선택된 프로젝트 출려
  console.log("선택된 프로젝트:", selectedProjects);

  return (
    <div className={styles.project_vote_form}>
      <div className={styles.title_form}>
        <div className={styles.title}>마음에 드는 프로젝트에</div>
        <div className={styles.title}>투표해주세요</div>
        <p className={styles.title_caption}>최대 3개</p>
      </div>

      <VoteProjectList
        handleProjectSelect={handleProjectSelect}
        selectedProjects={selectedProjects}
        setSelectedProjects={setSelectedProjects}
      />

      <button
        type="submit"
        className={sub_styles.submit_button}
        style={{ marginTop: "20px", marginBottom: "100px", cursor: "pointer" }}
      >
        투표 완료
      </button>
    </div>
  );
};
export default VoteForm;
