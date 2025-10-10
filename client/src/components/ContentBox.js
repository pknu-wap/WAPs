import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import "../assets/Filter/Type.css";
import "../App.css";
import "../assets/Filter/Contentbox.css";
import LoadingImage from "../assets/img/WAP_white_NoBG.png";

/* 알약 버튼 목록 (UI 전용) */
const TYPE_OPTIONS = [
  { label: "전체", value: "All" },
  { label: "웹", value: "Web" },
  { label: "앱", value: "App" },
  { label: "게임", value: "Game" },
  { label: "임베디드", value: "기타" },
];

// 프로젝트 타입을 한글로 변환하는 함수
const getTypeLabel = (type) => {
  const typeMap = {
    web: "웹",
    app: "앱",
    game: "게임",
    "기타": "임베디드",
  };
  return typeMap[type?.toLowerCase?.()] || type;
};

/* 색상용 클래스 키 */
const typeKey = (t) => {
  const key = (t || "").toString().toLowerCase();
  const map = { web: "web", app: "app", game: "game", "기타": "etc" };
  return map[key] || "etc";
};

const ContentBox = () => {
  const [filter, setFilter] = useState("All");
  const [yearAccordionOpen, setYearAccordionOpen] = useState(false);
  const [typeAccordionOpen, setTypeAccordionOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const [searchParams, setSearchParams] = useSearchParams();

  // URL에서 값을 읽어와 초기 상태 설정
  const initialYear = searchParams.get("projectYear") || currentYear;
  const initialSemester = searchParams.get("semester") || 1;

  const [semesterFilter, setSemesterFilter] = useState({
    year: parseInt(initialYear),
    semester: parseInt(initialSemester),
  });

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/project/list`;

  useEffect(() => {
    const timeoutId = setTimeout(() => setIsMounted(true), 700);

    const fetchData = async () => {
      try {
        const response = await axios.get(apiUrl, {
          params: {
            semester: semesterFilter.semester,
            projectYear: semesterFilter.year,
          },
        });

        if (Array.isArray(response.data.projectsResponse)) {
          setData(response.data.projectsResponse);
          setFilteredData(response.data.projectsResponse);
        } else {
          console.error("API 응답의 projectsResponse가 배열이 아닙니다:", response.data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch project data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
    return () => clearTimeout(timeoutId);
  }, [semesterFilter]);

  // 유형+검색어 필터
  useEffect(() => {
    let next = data;

    if (filter !== "All") {
      next = next.filter(
        (item) => item.projectType?.toLowerCase() === filter.toLowerCase()
      );
    }

    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      next = next.filter((item) => item.title?.toLowerCase().includes(q));
    }

    setFilteredData(next);
  }, [filter, data, searchTerm]);

  const toggleYearAccordion = () => setYearAccordionOpen(!yearAccordionOpen);
  const toggleTypeAccordion = () => setTypeAccordionOpen(!typeAccordionOpen);

  const handleSemesterChange = (year, semester) => {
    setSemesterFilter({ year, semester });
    setSearchParams({ projectYear: year, semester });
    setYearAccordionOpen(false);
  };

  if (isLoading) {
    return (
      <img
        src={LoadingImage}
        alt="Loading"
        style={{
          width: "150px",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    );
  }

  return (
    <div>
      <div className="hero">
        <div className="hero__inner">
          <h1 className="hero__title">
            WAP의<br />다양한 활동들을 만나보세요
          </h1>
          <p className="hero__subtitle">Discover WAP's diverse activities</p>

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
            <div className="pill-filter" role="tablist" aria-label="project type">
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

            {/* 학기 필터 드롭다운 */}
            <div className="filter-dropdown">
              <button onClick={toggleYearAccordion} className="dropdown-button">
                {yearAccordionOpen ? "년도/학기 ▲" : "년도/학기 ▼"}
              </button>
              {yearAccordionOpen && (
                <div className="dropdown-content">
                  <button onClick={() => handleSemesterChange(currentYear, 1)}>
                    1학기
                  </button>
                  <button onClick={() => handleSemesterChange(currentYear, 2)}>
                    2학기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="content-box mount1">
        {filteredData.map((item, index) => (
          <div
            key={index}
            className="box"
            onClick={() => navigate(`/project/${item.projectId}`)}
          >
            <div className="image">
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
                <span className={`project-type-tag tag--${typeKey(item.projectType)}`}>
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
