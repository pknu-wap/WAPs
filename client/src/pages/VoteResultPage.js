import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import styles from "../assets/ProjectVote.module.css";
import Header from "../components/Header";
import Menu from "../components/Menu";
import FloatingButton from "../components/FloatingButton";
import Cookies from "js-cookie";

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

  const [yearAccordionOpen, setYearAccordionOpen] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState({
    year: currentYear,
    semester: 1,
  });

  // URL 파라미터 파싱 (2025-01 형식)
  useEffect(() => {
    if (semesterParam) {
      const match = semesterParam.match(/^(\d{4})-(\d{2})$/);
      if (match) {
        setSemesterFilter({
          year: parseInt(match[1]),
          semester: parseInt(match[2]),
        });
      }
    } else {
      // 기본 화면일 때 현재 년도/학기로 설정
      setSemesterFilter({
        year: currentYear,
        semester: 1,
      });
    }
  }, [semesterParam, currentYear]);

  // API URL 생성
  const voteUrl = semesterParam
    ? `${process.env.REACT_APP_API_BASE_URL}/vote/result/${semesterParam}`
    : `${process.env.REACT_APP_API_BASE_URL}/vote/result`;

  const listUrl = semesterParam
    ? `${process.env.REACT_APP_API_BASE_URL}/project/list?semester=${semesterFilter.semester}&projectYear=${semesterFilter.year}`
    : `${process.env.REACT_APP_API_BASE_URL}/project/list?semester=1&projectYear=${currentYear}`;

  const [projects, setProjects] = useState([]);
  const [idByName, setIdByName] = useState({});
  const [selectedProjects, setSelectedProjects] = useState([]);

  // 순위 계산용
  let displayedRank = 1;
  let actualRank = 1;
  let prevVoteCount = null;

  // 이름 정규화
  const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // 인증 검사
  useEffect(() => {
    const token = Cookies.get("authToken");
    const validateAuth = async () => {
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }
      try {
        await axios.get(`${process.env.REACT_APP_API_BASE_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        alert("로그인 유효기간이 만료되었습니다. 재로그인 해주세요.");
        navigate("/login");
      }
    };
    validateAuth();
  }, [navigate]);

  // 데이터 fetch 로직
  useEffect(() => {
    let isMounted = true; // cleanup을 위한 플래그
    
    const fetchAll = async () => {
      try {
        // 투표 결과 먼저 확인
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

        // 프로젝트 리스트 가져오기
        const listRes = await axios.get(listUrl);
        
        if (!isMounted) return;
        
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

        const top1 = sorted
          .slice(0, 1)
          .map((p) => map[norm(p.projectName || p.title)])
          .filter(Boolean);
        setSelectedProjects(top1);
      } catch (e) {
        if (!isMounted) return;
        
        console.error("Error details:", e.response);
        // 400번대, 404, 500 에러인 경우 모두 "공개되지 않음"으로 처리
        if (e.response && (e.response.status === 400 || e.response.status === 404 || e.response.status === 500)) {
          alert("해당 학기 투표 결과는 아직 공개되지 않았습니다.");
          navigate("/vote/result", { replace: true });
          return;
        } else {
          alert("투표 결과 또는 프로젝트 목록을 가져오는데 실패했습니다.");
        }
      }
    };
    
    fetchAll();
    
    return () => {
      isMounted = false; // cleanup
    };
  }, [voteUrl, listUrl, navigate]);

  const handleProjectClick = (project) => {
    const name = project?.projectName || project?.title;
    const pid = idByName[norm(name)];
    if (!pid) {
      alert(`projectId를 찾을 수 없습니다.\n(이름 매칭 실패) name="${name}"`);
      return;
    }
    navigate(`/project/${pid}`);
  };

  const toggleYearAccordion = () => setYearAccordionOpen(!yearAccordionOpen);

  const handleSemesterChange = (year, semester) => {
    // API 명세에 맞게 0패딩 추가 (2025-01 형식)
    const semesterPath = `${year}-${String(semester).padStart(2, '0')}`;
    navigate(`/vote/result/${semesterPath}`);
    setYearAccordionOpen(false);
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
                style={{ fontSize: "12px", marginTop: "4px", color: "#ffffffad" }}
              >
                투표결과를 확인해보세요
              </div>

              {/* 드롭다운 추가 */}
              <div className="filter-container" style={{ marginTop: "20px", justifyContent: "flex-end", paddingRight: "20px" }}>
                <div className="filter-dropdown">
                  <button onClick={toggleYearAccordion} className="dropdown-button">
                    {yearAccordionOpen
                      ? "년도/학기 ▲"
                      : `${("0" + (semesterFilter.year - 2000)).slice(-2)}년 ${semesterFilter.semester}학기 ▼`}
                  </button>
                  {yearAccordionOpen && (
                    <div className="dropdown-content">
                      {Array.from(
                        { length: currentYear - 2025 + 1 },
                        (_, i) => currentYear - i
                      ).map((year) => {
                        const twoDigitYear = ("0" + (year - 2000)).slice(-2);
                        return (
                          <div key={year}>
                            <button onClick={() => handleSemesterChange(year, 2)}>
                              {twoDigitYear}-2
                            </button>
                            <button onClick={() => handleSemesterChange(year, 1)}>
                              {twoDigitYear}-1
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