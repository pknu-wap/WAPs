import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode"; // named export로 변경
import styles from "../../assets/ProjectDetail/ProjectDetailForm.module.css";
import dogImage from "../../assets/img/dog.png";

const ProjectDetailForm = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const token = Cookies.get("authToken"); // 로그인한 사용자 토큰
  const [isOwner, setIsOwner] = useState(false); // 작성자인지 확인
  const [projectData, setProjectData] = useState(null); // 프로젝트 데이터

  const apiUrl = `${process.env.REACT_APP_API_BASE_URL_PROXY}/api/project/${projectId}`;

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        // API 호출로 프로젝트 데이터 가져오기
        const response = await axios.get(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const data = response.data;
        setProjectData(data); // 프로젝트 데이터 설정
        console.log("API 응답 데이터:", data);

        if (token) {
          const decodedToken = jwtDecode(token); // 수정된 함수명 사용
          console.log("디코딩된 토큰:", decodedToken);
        
          // 토큰에서 추출한 ID와 프로젝트 작성자 ID 비교
          if (decodedToken.userId === data.ownerId) {
            setIsOwner(true);
          } else {
            setIsOwner(false);
          }
        }
        
      } catch (error) {
        console.error("프로젝트 정보 가져오기 실패:", error);
        alert("프로젝트 정보를 불러오는 데 실패했습니다.");
        navigate("/");
      }
    };

    fetchProjectDetails();
  }, [apiUrl, token, navigate]);

  // 프로젝트 삭제 요청
  const handleDelete = async () => {
    if (!window.confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await axios.delete(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 204) {
        alert("프로젝트가 성공적으로 삭제되었습니다.");
        navigate("/");
      } else {
        alert("프로젝트 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("프로젝트 삭제 중 오류 발생:", error);
      alert("프로젝트 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (!projectData) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.project_detail_form}>
      <img
        className={styles.thumnail_image}
        src={projectData.thumbnail || dogImage}
        alt="Project Thumbnail"
      />
      <div className={styles.project_detail_box}>
        <div className={styles.project_detail_title}>
          <h1>{projectData.title || "제목 없음"}</h1>
          <div className={styles.project_info}>
            <span>년도: {projectData.projectYear}</span> |{" "}
            <span>학기: {projectData.semester}</span>
          </div>
        </div>
        <div className={styles.project_detail_content}>
          <p>{projectData.content || "내용이 없습니다."}</p>
        </div>
      </div>

      {/* 삭제 버튼 */}
      {isOwner ? (
        <button
          onClick={handleDelete}
          className={styles.delete_button}
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          삭제하기
        </button>
      ) : (
        <p>이 프로젝트를 삭제할 권한이 없습니다.</p>
      )}
    </div>
  );
};

export default ProjectDetailForm;
