import { REQUIRED_VOTE_COUNT } from "../../constants/vote";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../assets/ProjectVote.module.css";
import sub_styles from "../../assets/ProjectCreation/ProjectForm.module.css";
import VoteProjectList from "./VoteProjectList";
import { projectApi } from "../../api/project";
import { voteApi } from "../../api/vote";

const VoteForm = ({ isVotedUser }) => {
  const navigate = useNavigate();
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [currentSemester, setCurrentSemester] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  // 투표한 프로젝트 불러오기
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setSelectedProjects([]);

    const fetchVotedProjects = async () => {
      try {
        const { semester } = await projectApi.getCurrentSemester();
        const [participants, ballot] = await Promise.all([
          voteApi.getParticipants(semester),
          isVotedUser ? voteApi.getMyVote(semester) : Promise.resolve(null),
        ]);
        if (!active) return;
        setCurrentSemester(semester);
        setProjects(participants);
        setSelectedProjects(ballot?.projectIds || []);
      } catch (error) {
        if (active)
          setError("투표 정보를 불러오지 못했습니다. 다시 시도해주세요.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchVotedProjects();
    return () => {
      active = false;
    };
  }, [isVotedUser, revision]);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (loading || error || !currentSemester || isVotedUser) return;

    if (selectedProjects.length !== REQUIRED_VOTE_COUNT) {
      alert(`프로젝트를 ${REQUIRED_VOTE_COUNT}개 선택해야 합니다.`);
      return;
    }

    const voteData = {
      projectIds: selectedProjects,
      semester: currentSemester,
    };

    try {
      await voteApi.submitVote(voteData);

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
      <div className={styles.bg_zone}>
        <div className={styles.title_form}>
          {isVotedUser ? (
            <>
              <div className={styles.vote_title}>
                <p>투표가 완료되었습니다.</p>
                <p>투표 결과를 기다려 주세요.</p>
              </div>
              <p className={styles.title_eng}>Wait for the voting results</p>
            </>
          ) : (
            <>
              <div className={styles.vote_title}>
                마음에 드는 프로젝트 {REQUIRED_VOTE_COUNT}개를 선택해 주세요
              </div>
              <p className={styles.title_eng}>
                Choose {REQUIRED_VOTE_COUNT} projects you like
              </p>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p role="status">투표 정보를 불러오는 중입니다...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => setRevision((value) => value + 1)}>
            다시 시도
          </button>
        </div>
      ) : (
        <VoteProjectList
          projects={projects}
          selectedProjects={selectedProjects}
          setSelectedProjects={setSelectedProjects}
          isVotedUser={isVotedUser}
        />
      )}

      {!isVotedUser && (
        <button
          type="submit"
          disabled={loading || !!error || projects.length === 0}
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
