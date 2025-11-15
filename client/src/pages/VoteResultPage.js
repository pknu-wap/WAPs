// VoteResultPage.jsx — 썸네일(좌) / 제목·내용·하단바(우) 레이아웃, 하단바(득표+버튼) 정렬
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../assets/ProjectVote.module.css";

// D 모양 아이콘 SVG 컴포넌트
const VoteIcon = ({ size = 20, color = "#b8ecff", className = "", ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path d="M2 2 H12 A10 10 0 0 1 12 22 H2 Z" fill={color} />
  </svg>
);

const VoteResultPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // 두 API URL
  const voteUrl = `${process.env.REACT_APP_API_BASE_URL}/vote/result?semester=1&projectYear=${currentYear}`;
  const listUrl = `${process.env.REACT_APP_API_BASE_URL}/project/list?semester=1&projectYear=${currentYear}`;

  const [projects, setProjects] = useState([]); // /vote/result 결과(득표수·비율 포함)
  const [idByName, setIdByName] = useState({}); // 프로젝트명→ID 매핑
  const [selectedProjects, setSelectedProjects] = useState([]); // 유지(상위 1개)

  // 순위 계산용
  let displayedRank = 1;
  let actualRank = 1;
  let prevVoteCount = null;

  // 이름 정규화
  const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [voteRes, listRes] = await Promise.all([
          axios.get(voteUrl),
          axios.get(listUrl),
        ]);

        // 1) 투표 결과 정렬
        const voteItems = Array.isArray(voteRes.data)
          ? voteRes.data
          : voteRes.data?.projectsResponse || [];
        const sorted = [...voteItems].sort((a, b) => b.voteCount - a.voteCount);
        setProjects(sorted);

        // 2) 프로젝트 리스트에서 이름→ID 매핑
        const listItemsRaw = Array.isArray(listRes.data)
          ? listRes.data
          : listRes.data?.projectsResponse || [];
        const map = {};
        listItemsRaw.forEach((p) => {
          const title = p?.title || p?.projectName;
          const pid = p?.projectId || p?.id;
          if (title && pid) map[norm(title)] = pid;
        });
        setIdByName(map);

        // 3) 상위 1개 선택(유지)
        const top1 = sorted
          .slice(0, 1)
          .map((p) => map[norm(p.projectName || p.title)])
          .filter(Boolean);
        setSelectedProjects(top1);
      } catch (e) {
        alert("투표 결과 또는 프로젝트 목록을 가져오는데 실패했다.");
        console.log(e);
      }
    };
    fetchAll();
  }, [voteUrl, listUrl]);

  // 버튼만 이동, ID로만 이동
  const handleProjectClick = (project) => {
    const name = project?.projectName || project?.title;
    const pid = idByName[norm(name)];
    if (!pid) {
      alert(`projectId를 찾을 수 없다.\n(이름 매칭 실패) name="${name}"`);
      return;
    }
    navigate(`/project/${pid}`);
  };

  return (
    <div className={`${styles.project_vote_form} ${styles.mount1}`}>
      <div className={styles.header_bg_zone}>
        <div className={styles.title_form}>
          <div
            className={styles.title}
            style={{
              fontSize: "30px",
              WebkitTextStrokeWidth: "1.3px",
              WebkitTextStrokeColor: "white",
              marginTop: "40px",
            }}
          >
            VOTING
            <br />
            RESULTS
          </div>
          <div
            className={styles.title}
            style={{ fontSize: "12px", marginTop: "4px", color: "#ffffffad" }}
          >
            투표결과를 확인해보세요
          </div>
        </div>
      </div>

      <div className={styles.project_list_form}>
        {Array.isArray(projects) && projects.length > 0 ? (
          projects.map((project, index) => {
            const isTie = project.voteCount === prevVoteCount;
            if (!isTie) displayedRank = actualRank;
            prevVoteCount = project.voteCount;
            actualRank++;

            const isTop3 = displayedRank <= 3;
            const opacityClass = isTop3 ? styles.rank_opacity_top3 : "";

            return (
              <div
                className={`${styles.project_list_box} ${
                  isTop3 ? styles.selected : ""
                }`}
                key={(project.projectId ?? project.projectName ?? index) + "-vote"}
              >
                {/* 상단: 썸네일(좌) + 오른쪽 컬럼(우) */}
                <div className={styles.inform_box}>
                  {project.thumbnail && (
                    <div className={styles.thumbnail_wrap}>
                      <span className={styles.rank_badge_out}>{displayedRank}</span>
                      <div className={styles.project_thumbnail}>
                        <img
                          className={styles.thumbnail_image}
                          alt={project.projectName || project.title || "thumbnail"}
                          src={project.thumbnail}
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}

                  {/* 오른쪽 컬럼: 제목/요약 + 하단바(득표/버튼) */}
                  <div className={styles.right_col}>
                    <div className={styles.project_title_form}>
                      <h2 className={styles.title}>
                        {project.projectName || project.title}
                      </h2>
                      <p className={styles.summary}>
                        {project.projectSummary || project.summary}
                      </p>
                    </div>

                    <div className={styles.bottom_row}>
                      <div className={styles.project_result_inline}>
                        {/* 아이콘 + 득표수 */}
                        <div
                          className={`${styles.project_vote_count} ${opacityClass}`}
                        >
                          <VoteIcon className={styles.vote_icon} />
                          <span>{project.voteCount} 득표</span>
                        </div>
                        <div className={styles.project_vote_rate}>
                          {project.voteRate}%
                        </div>
                      </div>

                      <button
                        className={styles.view_button}
                        onClick={() => handleProjectClick(project)}
                        aria-label={`${
                          project.projectName || project.title || "프로젝트"
                        } 상세 보러가기`}
                      >
                        보러가기 →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p>프로젝트 데이터를 불러오는 중이다...</p>
        )}
      </div>
    </div>
  );
};

export default VoteResultPage;








// 동률 표시하지 않는 코드
//  projects.map((project, index) => {
//             const isSelected = index < 3; // 상위 3개만 선택된 상태로 표시

//             return (
//               <div
//                 key={project.projectId}
//                 className={${styles.project_list_box}}
//               >
//                 <div className={styles.inform_box}>
//                   <div
//                     className={isSelected ? styles.selected_result : ""}
//                     style={{ marginTop: 10, fontSize: 18 }}
//                   >
//                     {index + 1}
//                   </div>
//                   {project.thumbnail && (
//                     <div className={styles.project_thumbnail}>
//                       <img
//                         className={styles.thumbnail_image}
//                         alt={project.title}
//                         src={project.thumbnail}
//                       />
//                     </div>
//                   )}

//                   <div className={styles.project_title_form}>
//                     <h2 className={styles.title}>{project.projectName}</h2>
//                     <p className={styles.summary}>{project.projectSummary}</p>
//                   </div>
//                   <div className={styles.project_result_form}>
//                     <div className={styles.project_vote_count}>
//                       {project.voteCount} 득표
//                     </div>
//                     <div className={styles.project_vote_rate}>
//                       {project.voteRate}%
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             );
//           })
//         )
