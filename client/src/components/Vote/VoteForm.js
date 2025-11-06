import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import styles from "../../assets/ProjectVote.module.css";
import sub_styles from "../../assets/ProjectCreation/ProjectForm.module.css";
import VoteProjectList from "./VoteProjectList";
// import useProjectvoteForm from "../../hooks/Projectvote/useProjectVoteForm";

// voteForm에 파라미터로 받음 .
const VoteForm = ({ isVotedUser }) => {
  const [votedProjects, setVotedProjects] = useState([]);
  // 투표한 프로젝트 정보 가져오기
  const fetchVotedProjectsUrl = `${process.env.REACT_APP_API_BASE_URL}/user/vote`;
  const token = Cookies.get("authToken");

  // const { selectedProjects, handleProjectSelect, setSelectedProjects } =
  //   useProjectvoteForm();

  const [selectedProjects, setSelectedProjects] = useState([]);

  // const handleProjectSelect = ({ projectId, isVotedUser }) => {
  //   console.log("클릭됨", projectId);

  //   if (isVotedUser) {
  //     alert("투표는 변경하실 수 없습니다.");
  //     return;
  //   }
  //   if (selectedProjects.includes(projectId)) {
  //     // 이미 선택된 프로젝트는 해제
  //     setSelectedProjects(selectedProjects.filter((id) => id !== projectId));
  //   } else {
  //     // 선택된 프로젝트가 3개 미만일 때만 추가
  //     if (selectedProjects.length < 3) {
  //       setSelectedProjects([...selectedProjects, projectId]);
  //     } else {
  //       alert("최대 3개의 프로젝트만 선택할 수 있습니다."); // 사용자에게 알림
  //     }
  //   }
  // };

  useEffect(() => {
    if (isVotedUser) {
      // 투표한 페이지 정보 가져오기
      const fetchVotedProjects = async () => {
        try {
          const response = await axios.get(fetchVotedProjectsUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setVotedProjects(response.data);
          // console.log(response.data);
          // 내가 선택한 정보 받아와서 보여주기

          // Voted한 User 일 때만 selectedProjcets에 설정해줌..
          setSelectedProjects(response.data.projectIds);

          // console.log(votedProjects);
        } catch (error) {
          alert("투표한 프로젝트 정보를 가져오는데 실패했습니다. ");
          // console.log(error);
        } finally {
          // setIsLoading(false);
        }
      };

      fetchVotedProjects();
    }
  }, [fetchVotedProjectsUrl, token]);

  const resetForm = () => {
    setSelectedProjects([]);
  };
  // setSelectedProjects(votedProjects);

  const navigate = useNavigate();
  // 선택된 프로젝트 출려
  // console.log("선택된 프로젝트:", selectedProjects);
  const handleSubmit = async (e) => {
    // 기본 이벤트 제거
    e.preventDefault();

    // 서버경로
    const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/vote`;

    // 프로젝트 데이터 : JSON 형식으로 준비
    const projectData = {
      projectIds: selectedProjects,
    };

    try {
      // JSON 데이터를 전송
      const response = await axios.post(apiUrl, projectData, {
        headers: {
          // json 형식으로 설정하니까 투표가 된 듯 함.
          "Content-Type": "application/json", // JSON 형식으로 설정
          Authorization: `Bearer ${token}`, // 인증 토큰 추가
        },
      });

      // 투표 성공 시
      alert("투표가 완료되었습니다.");
      resetForm(); // 폼 리셋
      window.location.reload(); // 페이지 리로드
      navigate("/ProjectPage");
    } catch (error) {
      // 에러 발생 정보
      if (error.response) {
        // 서버에서 응답을 받았을 경우
        if (error.response.status === 401) {
          // 인증 실패 시

          navigate("/ProjectPage");
        } else if (error.response.status === 404) {
          alert("프로젝트가 존재하지 않습니다.");
          navigate("/ProjectPage");
        } else {
          alert("알 수 없는 오류 발생");
          navigate("/ProjectPage");
        }
      } else if (error.request) {
        // 서버로 요청을 했지만 응답이 없을 경우
        // console.error("서버 응답 없음:", error.request);
        alert("서버 응답이 없습니다. 나중에 다시 시도해주세요.");
      } else {
        // 요청을 설정하는 중에 발생한 에러
        // console.error("Error", error.message);
        alert(`오류 발생: ${error.message}`);
      }
    }
  };

  return (
    <div className={`${styles.project_vote_form} ${styles.mount1}`}>
      <div className={styles.title_form}>
        <div
          className={styles.title}
          style={{
            fontSize: "22px",
          }}
        >
          마음에 드는 프로젝트에
        </div>
        <div
          className={styles.title}
          style={{
            fontSize: "22px",
          }}
        >
          투표해주세요
        </div>
        <p className={styles.title_caption}>최대 3개</p>
      </div>

      <VoteProjectList
        // handleProjectSelect={handleProjectSelect}
        selectedProjects={selectedProjects}
        setSelectedProjects={setSelectedProjects}
        isVotedUser={isVotedUser}
      />
      {isVotedUser ? (
        <div> </div>
      ) : (
        <button
          type="submit"
          className={sub_styles.submit_button}
          style={{
            marginTop: "20px",
            marginBottom: "100px",
            cursor: "pointer",
          }}
          onClick={handleSubmit}
        >
          투표 완료
        </button>
      )}
    </div>
  );
};
export default VoteForm;
