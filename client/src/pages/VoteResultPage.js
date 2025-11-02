import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "../assets/Vote/ProjectVote.module.css";

// 투표 기간이 아닐 때 나타나는 페이지임.
const VoteResultPage = () => {
  const currentYear = new Date().getFullYear(); // 현재 연도 가져오기
  // 날짜 체크 : 음....... 이거 월 설정을 어떻게 하면 좋을까납..?
  const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/vote/result?semester=1&projectYear=${currentYear}`;

  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);

  let displayedRank = 1;
  let actualRank = 1;
  let prevVoteCount = null;

  useEffect(() => {
    const fetchVoteResult = async () => {
      try {
        const response = await axios.get(apiUrl);

        // console.log(response.data);
        // 내림차순 정렬 (voteCount 기준)
        const sortedProjects = [...response.data].sort(
          (a, b) => b.voteCount - a.voteCount
        );
        setProjects(sortedProjects);
        const top3ProjectIds = sortedProjects
          .slice(0, 1)
          .map((project) => project.projectId);

        setSelectedProjects(top3ProjectIds);
      } catch (error) {
        alert("투표 결과를 가져오는데 실패했습니다.");
        console.log(error);
      } finally {
        // setIsLoading(false);
      }
    };

    fetchVoteResult();
  }, [apiUrl]);

  // 선택된 프로젝트 출려
  // console.log("선택된 프로젝트:", selectedProjects);

  return (
    <div className={`${styles.project_vote_form} ${styles.mount1}`}>
      <div className={styles.title_form}>
        <div
          className={styles.title}
          style={{
            fontSize: "22px",
          }}
        >
          투표가 완료되었습니다!
        </div>
        <div
          className={styles.title}
          style={{
            fontSize: "22px",
          }}
        >
          투표 결과를 확인해보세요.
        </div>
        <p className={styles.title_caption}></p>
      </div>

      <div className={styles.project_list_form}>
        {Array.isArray(projects) && projects.length > 0 ? (
          projects.map((project, index) => {
            const isTie = project.voteCount === prevVoteCount;

            if (!isTie) {
              displayedRank = actualRank;
            }

            prevVoteCount = project.voteCount;
            actualRank++;

            const isTop3 = displayedRank <= 3;
            // 순위에 따라 투명도 클래스 결정 
            let opacityClass;
            if (displayedRank <= 3) {
              // 1, 2, 3위
              opacityClass = styles.rank_opacity_top3;
            } else if (displayedRank === 4) {
              // 4위
              opacityClass = styles.rank_opacity_4;
            } else if (displayedRank === 5) {
              // 5위
              opacityClass = styles.rank_opacity_5;
            } else {
              // 6위 이하
              opacityClass = styles.rank_opacity_other;
            }
            return (
              <div
                className={`${styles.project_list_box}`}
                key={project.projectId}
              >
                <div className={styles.inform_box}>
                  <div
                    className={`
                      ${styles.rank_layout}
                      ${isTop3 ? styles.selected_result : styles.rank_default_color}
                      ${opacityClass}
                    `}
                    style={{ marginTop: 10, fontSize: 18 }}
                  >
                    {displayedRank}
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
                    <h2 className={styles.title}>{project.projectName}</h2>
                    <p className={styles.summary}>{project.projectSummary}</p>
                  </div>
                  <div className={styles.project_result_form}>
                    <div className={`
                        ${styles.project_vote_count}
                        ${opacityClass}
                      `}>
                      {project.voteCount} 득표
                    </div>
                    <div className={styles.project_vote_rate}>
                      {project.voteRate}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p>프로젝트 데이터를 불러오는 중입니다...</p>
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
