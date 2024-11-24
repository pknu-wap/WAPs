import React from "react";
import axios from "axios";
import Cookies from "js-cookie";
import dogImage from "../../assets/img/dog.png";
import styles from "../../assets/Vote/ProjectVote.module.css";
import sub_styles from "../../assets/ProjectCreation/ProjectForm.module.css";
import VoteProjectList from "./VoteProjectList";
import useProjectvoteForm from "../../hooks/Projectvote/useProjectVoteForm";
const VoteForm = () => {
  const token = Cookies.get("authToken");
  const { selectedProjects, handleProjectSelect, setSelectedProjects } =
    useProjectvoteForm();
  const resetForm = () => {
    setSelectedProjects([]);
  };
  // 선택된 프로젝트 출려
  console.log("선택된 프로젝트:", selectedProjects);
  const handleSubmit = async (e) => {
    // 기본 이벤트 제거
    e.preventDefault();

    // 서버경로
    const apiUrl = `${process.env.REACT_APP_API_BASE_URL_PROXY}/api/vote`;

    // 프로젝트 데이터 : JSON 형식으로 준비
    const projectData = {
      projectIds: selectedProjects,
    };

    try {
      // JSON 데이터를 전송
      const response = await axios.post(apiUrl, projectData, {
        headers: {
          "Content-Type": "application/json", // JSON 형식으로 설정
          Authorization: `Bearer ${token}`, // 인증 토큰 추가
        },
      });

      // 투표 성공 시
      alert("투표가 완료되었습니다.");

      console.log("투표 성공");
      console.log("투표 데이터:", response.data);

      resetForm(); // 폼 리셋
      window.location.reload(); // 페이지 리로드
    } catch (error) {
      // 에러 발생 정보
      if (error.response) {
        // 서버에서 응답을 받았을 경우
        console.error("투표 실패:", error.response);
        alert(
          `투표 실패: ${error.response.data.message || "알 수 없는 오류 발생"}`
        );
      } else if (error.request) {
        // 서버로 요청을 했지만 응답이 없을 경우
        console.error("서버 응답 없음:", error.request);
        alert("서버 응답이 없습니다. 나중에 다시 시도해주세요.");
      } else {
        // 요청을 설정하는 중에 발생한 에러
        console.error("Error", error.message);
        alert(`오류 발생: ${error.message}`);
      }
    }
  };

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
        onClick={handleSubmit}
      >
        투표 완료
      </button>
    </div>
  );
};
export default VoteForm;
