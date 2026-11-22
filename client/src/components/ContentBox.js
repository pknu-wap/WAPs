import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { projectApi } from "../api/project";
import "../App.css";
import "../assets/Contentbox.css";
import useSemester from "../hooks/useSemester";

/* 알약 버튼 목록 (UI 전용) */
const TYPE_OPTIONS = [
  { label: "전체", value: "All" },
  { label: "웹", value: "Web" },
  { label: "앱", value: "App" },
  { label: "게임", value: "Game" },
  { label: "기타", value: "기타" },
];

const SAMPLE_PROJECTS = [
  {
    projectId: "campus-map",
    title: "캠퍼스 한눈에",
    projectType: "Web",
    summary: "강의실과 동아리방을 검색하고 교내 시설을 지도에서 찾는 서비스입니다.",
    thumbnailBackground: "linear-gradient(135deg, #183e70, #62a3da)",
  },
  {
    projectId: "study-mate",
    title: "스터디메이트",
    projectType: "App",
    summary: "스터디원을 모집하고 함께 세운 목표와 진행 상황을 기록하는 앱입니다.",
    thumbnailBackground: "linear-gradient(135deg, #234b3f, #82b58e)",
  },
  {
    projectId: "space-delivery",
    title: "우주 택배부",
    projectType: "Game",
    summary: "장애물을 피해 제한 시간 안에 행성마다 소포를 배달하는 아케이드 게임입니다.",
    thumbnailBackground: "linear-gradient(135deg, #392656, #9578bf)",
  },
  {
    projectId: "club-radio",
    title: "동아리 라디오",
    projectType: "기타",
    summary: "동아리원의 개발 경험과 프로젝트 뒷이야기를 담은 오디오 아카이브입니다.",
    thumbnailBackground: "linear-gradient(135deg, #733a2b, #d78e61)",
  },
];
const EMPTY_PROJECTS = [];

// 프로젝트 타입을 한글로 변환하는 함수
const getTypeLabel = (type) => {
  const typeMap = {
    web: "웹",
    app: "앱",
    game: "게임",
    기타: "기타",
  };
  return typeMap[type?.toLowerCase?.()] || type;
};

/* 색상용 클래스 키 */
const typeKey = (t) => {
  const key = (t || "").toString().toLowerCase();
  const map = { web: "web", app: "app", game: "game", 기타: "etc" };
  return map[key] || "etc";
};

const toSemester = (year, semester) =>
  `${year}-${String(semester).padStart(2, "0")}`;

const normalizeSemesterParam = (semester, projectYear, fallback) => {
  if (semester?.includes("-")) {
    return semester;
  }

  if (semester && projectYear) {
    return toSemester(projectYear, semester);
  }

  return fallback;
};

const formatSemesterLabel = (semester) => {
  const [year, semesterValue] = semester.split("-");
  return `${("0" + (Number(year) - 2000)).slice(-2)}년 ${Number(semesterValue)}학기`;
};

const ContentBox = () => {
  const [filter, setFilter] = useState("All");
  const [yearAccordionOpen, setYearAccordionOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const [searchParams, setSearchParams] = useSearchParams();

  // useSemester 훅을 사용하여 초기 학기/년도 상태 설정
  const semesterString = useSemester();
  const showSamples =
    process.env.NODE_ENV === "development" &&
    searchParams.get("preview") === "samples";

  // URL에서 값을 읽어와 초기 상태 설정, 없으면 useSemester 값 사용
  const initialSemester = normalizeSemesterParam(
    searchParams.get("semester"),
    searchParams.get("projectYear"),
    semesterString,
  );

  const [semesterFilter, setSemesterFilter] = useState(initialSemester);

  const [projects, setProjects] = useState(EMPTY_PROJECTS);
  const [isFetching, setIsFetching] = useState(true);
  const sampleProjects =
    semesterFilter === semesterString ? SAMPLE_PROJECTS : EMPTY_PROJECTS;
  const data = showSamples ? sampleProjects : projects;
  const isLoading = !showSamples && isFetching;
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (showSamples) return;

    setIsFetching(true);
    let active = true;
    const fetchData = async () => {
      try {
        const response = await projectApi.getProjectList(semesterFilter);
        if (!active) return;

        if (Array.isArray(response.projectsResponse)) {
          setProjects(response.projectsResponse);
        } else {
          console.error(
            "API 응답의 projectsResponse가 배열이 아닙니다:",
            response,
          );
          setProjects([]);
        }
        setIsFetching(false);
      } catch (error) {
        if (!active) return;
        console.error("Failed to fetch project data:", error);
        setProjects([]);
        setIsFetching(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [semesterFilter, showSamples]);

  // 유형+검색어 필터
  const filteredData = useMemo(() => {
    let next = data;

    if (filter !== "All") {
      next = next.filter(
        (item) => item.projectType?.toLowerCase() === filter.toLowerCase(),
      );
    }

    if (searchTerm.trim() !== "") {
      const q = searchTerm.trim().toLowerCase();
      next = next.filter((item) => item.title?.toLowerCase().includes(q));
    }

    return next;
  }, [filter, data, searchTerm]);

  const toggleYearAccordion = () => setYearAccordionOpen(!yearAccordionOpen);

  const handleSemesterChange = (year, semester) => {
    const nextSemester = toSemester(year, semester);
    setSemesterFilter(nextSemester);
    const params = { semester: nextSemester };
    if (showSamples) params.preview = "samples";
    setSearchParams(params);
    setYearAccordionOpen(false);
  };

  const isBaseEmpty =
    !isLoading && data.length === 0 && filter === "All" && searchTerm.trim() === "";
  const isFilteredEmpty = !isLoading && !isBaseEmpty && filteredData.length === 0;

  return (
    <div>
      <div className="hero">
        <div className="hero__inner">
          <h1 className="hero__title">
            WAP의{" "}
            <br />
            다양한 활동들을 만나보세요
          </h1>
          <p className="hero__subtitle">Discover WAP's diverse activities</p>
          
          <div className="hero__badge">
            PROJECTS
          </div>
          
          {/* 검색창 */}
          <div className="hero__search">
            <div className="search-bar">
              <span className="search-icon" aria-hidden="true">
                <img
                  src="https://svgsilh.com/svg_v2/1093183.svg"
                  alt=""
                  className="search-icon-img"
                  loading="lazy"
                />
              </span>
              <input
                type="text"
                placeholder="왑의 프로젝트를 검색해보세요!"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="project title search"
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-container">
            {/* 유형: 알약 버튼 그룹 */}
            <div
              className="pill-filter"
              role="tablist"
              aria-label="project type"
            >
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  role="tab"
                  aria-selected={filter === t.value}
                  className={`pill ${filter === t.value ? "active" : ""}`}
                  onClick={() => setFilter(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 연도 + 학기 필터 드롭다운 */}
            <div className="filter-dropdown">
              <button onClick={toggleYearAccordion} className="dropdown-button">
                {yearAccordionOpen
                  ? "년도/학기 ▲"
                  : `${formatSemesterLabel(semesterFilter)} ▼`}
              </button>
              {yearAccordionOpen && (
                <div className="dropdown-content">
                  {/* 2025년부터 현재년도까지 역순 표시 */}
                  {Array.from(
                    { length: currentYear - 2025 + 1 },
                    (_, i) => currentYear - i,
                  ).map((year) => {
                    const twoDigitYear = ("0" + (year - 2000)).slice(-2); //연도가 두자릿수로 표시되도록
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

      <div className="content-box" aria-busy={isLoading}>
        {isLoading && (
          <div className="empty-state" role="status">
            프로젝트를 불러오는 중입니다.
          </div>
        )}
        {isBaseEmpty && (
          <div className="empty-state">
            <div className="empty-state__title">
              아직 이번 학기 프로젝트가 등록되지 않았어요
            </div>
            <div className="empty-state__subtitle">
              새로운 프로젝트가 등록되면 이곳에서 확인할 수 있어요.
            </div>
          </div>
        )}

        {isFilteredEmpty && (
          <div className="empty-state">
            <div className="empty-state__title">
              조건에 맞는 프로젝트가 없어요
            </div>
            <div className="empty-state__subtitle">
              필터를 변경하거나 검색어를 지워보세요.
            </div>
          </div>
        )}

        {!isBaseEmpty &&
          !isFilteredEmpty &&
          filteredData.map((item, index) => (
            <div
              key={item.projectId ?? index}
              className="box"
              onClick={
                showSamples ? undefined : () => navigate(`/project/${item.projectId}`)
              }
              style={showSamples ? { cursor: "default" } : undefined}
            >
              <div
                className="image"
                style={
                  showSamples ? { background: item.thumbnailBackground } : undefined
                }
              >
                {item.thumbnail && (
                  <img
                    className="project-image"
                    alt={item.title}
                    src={item.thumbnail}
                  />
                )}
              </div>

              <div className="titlebox">
                <div className="title-row">
                  <h2>{item.title}</h2>
                  <span
                    className={`project-type-tag tag--${typeKey(item.projectType)}`}
                  >
                    {getTypeLabel(item.projectType)}
                  </span>
                </div>
                <p>{item.summary}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ContentBox;
