import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import '../assets/Filter/Type.css';
import '../App.css';

const ContentBox = () => {
  const [filter, setFilter] = useState('All');
  const [yearAccordionOpen, setYearAccordionOpen] = useState(false);
  const [typeAccordionOpen, setTypeAccordionOpen] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [isMounted, setIsMounted] = useState(false); // 일정 시간 후 마운트될 상태
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear(); // 현재 연도 가져오기
  const apiUrl = `${process.env.REACT_APP_API_BASE_URL_PROXY}/api/project/list?semester=2&projectYear=${currentYear}`;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsMounted(true); // 일정 시간 후에 마운트 상태 변경
    }, 700); // 3초 후에 마운트 상태 변경 (3000ms)

    // API 호출 함수
    const fetchData = async () => {
      const token = Cookies.get("authToken"); // 토큰을 가져옴
      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      try {
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 응답 데이터를 콘솔에 출력하여 형식을 확인

        console.log("API 응답 데이터:", response.data);

        if (Array.isArray(response.data.projectsResponse)) {
          setData(response.data.projectsResponse);
          setFilteredData(response.data.projectsResponse);
        } else {
          console.error("API 응답의 projectsResponse가 배열이 아닙니다:", response.data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch project data:', error);
        setIsLoading(false);
      }
    };

    fetchData(); // API 호출

    // 클린업 함수: 컴포넌트 언마운트 시 타임아웃 정리
    return () => clearTimeout(timeoutId);
  }, [currentYear]); // currentYear가 변경될 때마다 fetchData 호출

  useEffect(() => {
    if (filter === 'All') {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(item => item.projectType.toLowerCase() === filter.toLowerCase()));
    }
  }, [filter, data]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const toggleYearAccordion = () => {
    setYearAccordionOpen(!yearAccordionOpen);
  };

  const toggleTypeAccordion = () => {
    setTypeAccordionOpen(!typeAccordionOpen);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "1rem" }}>로딩 중...</div>
    ); // 일정 시간 후 컴포넌트가 마운트되지 않으면 로딩 표시
  }

  return (
    <div>
      <div className="filter-container">
        <div className="filter-dropdown">
          <button onClick={toggleTypeAccordion} className="dropdown-button">
            {typeAccordionOpen ? 'Type ▲' : 'Type ▼'}
          </button>
          {typeAccordionOpen && (
            <div className="dropdown-content">
              <button onClick={() => handleFilterChange('All')}>All</button>
              <button onClick={() => handleFilterChange('App')}>App</button>
              <button onClick={() => handleFilterChange('Web')}>Web</button>
              <button onClick={() => handleFilterChange('Game')}>Game</button>
              <button onClick={() => handleFilterChange('Etc')}>Etc</button>
            </div>
          )}
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
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentBox;
