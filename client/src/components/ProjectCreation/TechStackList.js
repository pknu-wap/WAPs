import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../../assets/ProjectCreation/YearSelector.css"; // CSS 파일 경로 추가

const TechStackList = () => {
  const [techStacks, setTechStacks] = useState([]);
  const [selectedTechStack, setSelectedTechStack] = useState(null);
  const scrollRef = useRef(null);

  // 엔드포인트 정보
  const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/techStack/list`;

  useEffect(() => {
    const fetchTechStacks = async () => {
      try {
        const response = await axios.get(apiUrl);
        setTechStacks(response.data.techStackResponse);
      } catch (error) {
        console.error("Failed to fetch tech stacks:", error);
      }
    };
    fetchTechStacks();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollPosition = scrollRef.current.scrollTop;
        const itemHeight = 26; // CSS에서 설정한 p 태그의 높이와 일치해야 합니다.

        let index = Math.round(scrollPosition / itemHeight);
        index = Math.max(0, Math.min(index, techStacks.length - 1));

        setSelectedTechStack(techStacks[index].techStackName);
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
  }, [techStacks]);

  const handleTechStackClick = (techStackName) => {
    setSelectedTechStack(techStackName);
    if (scrollRef.current) {
      const index = techStacks.findIndex(
        (techStack) => techStack.techStackName === techStackName
      );
      const itemHeight = 26;
      scrollRef.current.scrollTop = index * itemHeight;
    }
  };

  return (
    <div className="year-selector">
      <label className="year-label">기술스택</label>
      <div className="scroll-container" ref={scrollRef}>
        {techStacks.map((techStack) => (
          <p
            key={techStack.techStackName}
            className={`year-item ${
              techStack.techStackName === selectedTechStack ? "selected" : ""
            }`}
            onClick={() => handleTechStackClick(techStack.techStackName)}
          >
            {techStack.techStackName} - {techStack.techStackType}
          </p>
        ))}
      </div>
    </div>
  );
};

export default TechStackList;
