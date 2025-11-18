import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../assets/ProjectVote.module.css";
import sub_styles from "../../assets/ProjectCreation/ProjectForm.module.css";
import VoteProjectList from "./VoteProjectList";
import { getCurrentSemester } from "../../utils/dateUtils";
import apiClient from "../../utils/api";

const VoteForm = ({ isVotedUser }) => {
  const navigate = useNavigate();
  const [selectedProjects, setSelectedProjects] = useState([]);

  // 투표한 프로젝트 불러오기
  useEffect(() => {
    if (!isVotedUser) return;

    const fetchVotedProjects = async () => {
      try {
        const response = await apiClient.get("/user/vote");
        setSelectedProjects(response.data.projectIds || []);
      } catch (error) {
        console.error("Failed to fetch voted projects:", error);
        alert("투표한 프로젝트 정보를 가져오는데 실패했습니다.");
      }
    };

    fetchVotedProjects();
  }, [isVotedUser]);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();

    const voteData = {
      projectIds: selectedProjects,
      semester: getCurrentSemester(),
    };

    try {
      await apiClient.post("/vote", voteData);

      alert("투표가 완료되었습니다.");
      setSelectedProjects([]);
      window.location.reload();
      navigate("/ProjectPage");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      alert(errorMessage);

      if (error.response?.status === 401) {
        navigate("/ProjectPage");
      }
    }
  };

  const getErrorMessage = (error) => {
    if (error.response?.status === 401) {
      return "인증에 실패했습니다.";
    }
    if (error.response?.status === 404) {
      return "프로젝트가 존재하지 않습니다.";
    }
    if (error.request) {
      return "서버 응답이 없습니다. 나중에 다시 시도해주세요.";
    }
    return error.message || "알 수 없는 오류가 발생했습니다.";
  };

  return (
    <div className={`${styles.project_vote_form} ${styles.mount1}`}>
      <div className={styles.title_form}>
        <div className={styles.title}>마음에 드는 프로젝트에</div>
        <div className={styles.title}>투표해주세요</div>
        <p className={styles.title_caption}>최대 3개</p>
      </div>

      <VoteProjectList
        selectedProjects={selectedProjects}
        setSelectedProjects={setSelectedProjects}
        isVotedUser={isVotedUser}
      />

      {!isVotedUser && (
        <button
          type="submit"
          className={sub_styles.submit_button}
          onClick={handleVoteSubmit}
          style={{
            marginTop: "20px",
            marginBottom: "100px",
            cursor: "pointer",
          }}
        >
          투표 완료
        </button>
      )}
    </div>
  );
};

export default VoteForm;
