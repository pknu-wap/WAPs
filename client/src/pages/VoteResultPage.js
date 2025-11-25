import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import styles from "../assets/ProjectVote.module.css";
import Header from "../components/Header";
import Menu from "../components/Menu";
import FloatingButton from "../components/FloatingButton";

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
  const { semesterParam } = useParams(); // URL에서 yyyy-s 형태로 받음
  const currentYear = new Date().getFullYear();

  // semesterParam 즉시 파싱 -> 초기값으로 사용
  const defaultFilter = (() => {
    if (!semesterParam) {
      return { year: currentYear, semester: 1 };
    }
    const match = semesterParam.match(/^(\d{4})-(\d{2})$/);
    return match
      ? { year: parseInt(match[1]), semester: parseInt(match[2]) }
      : { year: currentYear, semester: 1 };
  })();

  const [semesterFilter, setSemesterFilter] = useState(defaultFilter);

  // API URL 생성
  const voteUrl = semesterParam
    ? `${process.env.REACT_APP_API_BASE_URL}/vote/result/${semesterParam}`
    : `${process.env.REACT_APP_API_BASE_URL}/vote/result`;

  const [projects, setProjects] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // 순위 계산용
  let displayedRank = 1;
  let actualRank = 1;
  let prevVoteCount = null;

  const toggleMenu = () => setMenuOpen(!menuOpen);
  useEffect(() => {
    let isMounted = true; // cleanup을 위한 플래그

    const fetchVoteResults = async () => {
      try {
        const voteRes = await axios.get(voteUrl);
        if (!isMounted) return; // 컴포넌트가 언마운트되면 중단

        const voteItems = Array.isArray(voteRes.data)
          ? voteRes.data
          : voteRes.data?.projectsResponse || [];

        // 데이터가 비어있으면 공개되지 않은 것으로 간주
        if (!voteItems || voteItems.length === 0) {
          alert("해당 학기 투표 결과는 아직 공개되지 않았습니다.");
          navigate("/vote/result", { replace: true });
          return;
        }

        const sorted = [...voteItems].sort((a, b) => b.voteCount - a.voteCount);
        setProjects(sorted);
      } catch (e) {
        if (!isMounted) return;

        const status = e?.response?.status;
        if (status === 400 || status === 404 || status === 500) {
          alert("해당 학기 투표 결과는 아직 공개되지 않았습니다.");
          navigate("/vote/result", { replace: true });
        } else {
          alert("투표 결과를 가져오는데 실패했습니다.");
        }
      }
    };

    fetchVoteResults();
    return () => {
      isMounted = false; // cleanup
    };
  }, [voteUrl, navigate]);

  const handleProjectClick = (project) => {
    const pid = project.projectId;
    if (!pid) {
      alert("projectId가 없습니다. (백엔드 응답 확인 필요)");
      return;
    }
    navigate(`/project/${pid}`);
  };

  const toggleYearAccordion = () =>
    setSemesterFilter((prev) => ({ ...prev, open: !prev.open }));

  const handleSemesterChange = (year, semester) => {
    const formatted = `${year}-${String(semester).padStart(2, "0")}`;
    navigate(`/vote/result/${formatted}`);
  };

  return (
    <div className="container">
      <Header toggleMenu={toggleMenu} />
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <main>
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
                style={{
                  fontSize: "12px",
                  marginTop: "4px",
                  color: "#ffffffad",
                }}
              >
                투표결과를 확인해보세요
              </div>

              {/* 드롭다운 */}
              <div
                className="filter-container"
                style={{
                  marginTop: "20px",
                  justifyContent: "flex-end",
                  paddingRight: "20px",
                }}
              >
                <div className="filter-dropdown">
                  <button onClick={toggleYearAccordion} className="dropdown-button">
                    {semesterFilter?.open
                      ? "년도/학기 ▲"
                      : `${("0" + (semesterFilter.year - 2000)).slice(-2)}년 ${
                          semesterFilter.semester
                        }학기 ▼`}
                  </button>

                  {semesterFilter?.open && (
                    <div className="dropdown-content">
                      {Array.from(
                        { length: currentYear - 2025 + 1 },
                        (_, i) => currentYear - i
                      ).map((year) => {
                        const y = ("0" + (year - 2000)).slice(-2);
                        return (
                          <div key={year}>
                            <button onClick={() => handleSemesterChange(year, 2)}>
                              {y}-2
                            </button>
                            <button onClick={() => handleSemesterChange(year, 1)}>
                              {y}-1
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 프로젝트 리스트 */}
          <div className={styles.project_list_form}>
            {projects.length > 0 ? (
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
                      isTop3 ? styles.selected_result : ""
                    }`}
                    key={`${project.projectId}-${index}`}
                  >
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
              <p>프로젝트 데이터를 불러오는 중입니다...</p>
            )}
          </div>
        </div>
      </main>

      <FloatingButton />
    </div>
  );
};

export default VoteResultPage;