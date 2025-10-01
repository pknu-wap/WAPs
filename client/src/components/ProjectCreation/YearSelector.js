import React, { useEffect, useRef } from "react";
// 스크롤 이벤트를 등록하기 위해 useEffect, useRef 사용
import "../../assets/ProjectCreation/YearSelector.css"; // External CSS file

const YearSelector = ({ selectedYear, setSelectedYear }) => {
  // 스크롤 컨테이너 참조
  const scrollRef = useRef(null);

  // 현재까지의 연도/학기를 배열로 생성
  const generateSemesters = () => {
    const today = new Date();
    const startYear = 2000;
    const endYear = today.getFullYear();
    const semesters = [];

    for (let year = startYear; year <= endYear; year++) {
      semesters.push({ year, semester: 1 });
      semesters.push({ year, semester: 2 });
    }
    // 역순 정렬
    semesters.reverse();
    return semesters;
  };

  const semesters = generateSemesters();

  // 스크롤 이벤트
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollPosition = scrollRef.current.scrollTop;
        // 각 아이템의 높이 지정
        const itemHeight = 26;
        // 스크롤 위치에 따른 인덱스 계산
        let index = Math.round(scrollPosition / itemHeight);

        // 인덱스를 배열 범위 내로 제한
        index = Math.max(0, Math.min(index, semesters.length - 1));

        const selected = semesters[index];
        setSelectedYear(selected);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [setSelectedYear, semesters]);

  // 만약 이미 연도/학기가 선택되어 있다면 해당 연도/학기로 스크롤 이동
  useEffect(() => {
    if (scrollRef.current && selectedYear) {
      const index = semesters.findIndex(
        (s) =>
          s.year === selectedYear.year && s.semester === selectedYear.semester
      );
      if (index !== -1) {
        const itemHeight = 26;
        scrollRef.current.scrollTop = index * itemHeight;
      }
    }
  }, [selectedYear, semesters]);

  // 클릭 핸들러
  const handleClick = (item) => {
    setSelectedYear(item); // 클릭한 년도로 선택 변경
    if (scrollRef.current) {
      // 클릭 시 스크롤을 해당 위치로 이동
      const index = semesters.findIndex(
        (s) => s.year === item.year && s.semester === item.semester
      );
      if (index !== -1) {
        const itemHeight = 26; // 각 아이템의 높이
        scrollRef.current.scrollTop = index * itemHeight; // 스크롤 위치 설정
      }
    }
  };

  return (
    <div className="year-selector">
      <label className="year-label">학기 선택</label>
      <div className="scroll-container" ref={scrollRef}>
        {semesters.map((item, idx) => (
          <p
            key={`${item.year}-${item.semester}`}
            className={`year-item ${
              selectedYear &&
              item.year === selectedYear.year &&
              item.semester === selectedYear.semester
                ? "selected"
                : ""
            }`}
            onClick={() => handleClick(item)} // 클릭 이벤트 추가
          >
            {item.year}년 {item.semester}학기
          </p>
        ))}
      </div>
    </div>
  );
};

export default YearSelector;
