import { REQUIRED_VOTE_COUNT } from "../../constants/vote";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../assets/ProjectVote.module.css";
import sub_styles from "../../assets/ProjectCreation/ProjectForm.module.css";
import previewThumbnail from "../../assets/img/dog.png";
import VoteProjectList from "./VoteProjectList";
import { projectApi } from "../../api/project";
import { voteApi } from "../../api/vote";

const previewProjects = Array.from({ length: REQUIRED_VOTE_COUNT + 1 }, (_, index) => ({
  participants: `preview-${index + 1}`,
  title: `예시 프로젝트 ${index + 1}`,
  summary: "로컬 투표 화면 테스트용 프로젝트입니다.",
  thumbnail: previewThumbnail,
}));

const VoteForm = ({ isVotedUser, preview = false }) => {
  const navigate = useNavigate();
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [currentSemester, setCurrentSemester] = useState("");
  const [projects, setProjects] = useState(preview ? previewProjects : []);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const pending = useRef(false);

  // 투표한 프로젝트 불러오기
  useEffect(() => {
    if (preview) return;
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
  }, [isVotedUser, preview, revision]);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (pending.current || loading || error || (!preview && !currentSemester) || isVotedUser)
      return;

    if (selectedProjects.length !== REQUIRED_VOTE_COUNT) {
      alert(`프로젝트를 ${REQUIRED_VOTE_COUNT}개 선택해야 합니다.`);
      return;
    }

    if (preview) {
      alert("테스트 투표가 완료되었습니다.");
      setSelectedProjects([]);
      return;
    }

    const voteData = {
      projectIds: selectedProjects,
      semester: currentSemester,
    };

    pending.current = true;
    setSubmitting(true);
    try {
      await voteApi.submitVote(voteData);

      alert("투표가 완료되었습니다.");
      navigate("/ProjectPage");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      alert(errorMessage);

      pending.current = false;
      setSubmitting(false);
    }
  };

  const getErrorMessage = (error) => {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.status === 401) {
      return "인증에 실패했습니다.";
    }
    if (error.response?.status === 404) {
      return "프로젝트가 존재하지 않습니다.";
    }
    if (error.response) {
      return "투표 요청이 거절되었습니다. 투표 상태를 확인하고 다시 시도해주세요.";
    }
    if (error.request) {
      return "서버 응답이 없습니다. 나중에 다시 시도해주세요.";
    }
    return error.message || "알 수 없는 오류가 발생했습니다.";
  };

  return (
    <div className={`${styles.project_vote_form} ${styles.mount1} page-header-gradient`}>
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
              <div className={`${styles.vote_title} ${styles.vote_prompt}`}>
                마음에 드는 프로젝트 {REQUIRED_VOTE_COUNT}개를 선택해 주세요
              </div>
              <p className={`${styles.title_eng} ${styles.vote_prompt_translation}`}>
                Choose {REQUIRED_VOTE_COUNT} projects you like
              </p>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p role="status">투표 정보를 불러오는 중입니다...</p>
      ) : error ? (
        <div>
          <p role="alert">{error}</p>
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
          disabled={submitting}
        />
      )}

      {!isVotedUser && (
        <button
          type="submit"
          disabled={loading || !!error || submitting || projects.length === 0}
          className={sub_styles.submit_button}
          onClick={handleVoteSubmit}
          style={{
            marginTop: "20px",
            marginBottom: "100px",
            cursor:
              loading || error || submitting || projects.length === 0
                ? "not-allowed"
                : "pointer",
          }}
        >
          {submitting ? "투표 중..." : "투표 완료"}
        </button>
      )}
    </div>
  );
};

export default VoteForm;
