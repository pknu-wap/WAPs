import React from "react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../../assets/ProjectCreation/TechStackSelector.css";
import TechStackList from "./TechStackList";

const TechStackSelector = () => {
  // 버튼 클릭시 기술 스택 선택창 열기
  const [content, setContent] = useState(null);

  const [techStacks, setTechStacks] = useState([]);
  const [selectedTechStack, setSelectedTechStack] = useState(null);
  const [selectedTechStacks, setSelectedTechStacks] = useState([]);

  const scrollRef = useRef(null);

  // 엔드포인트 정보
  const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/techStack/list`;

  useEffect(() => {
    const fetchTechStacks = async () => {
      try {
        const response = await axios.get(apiUrl);
        // 배열이 아닌 경우 빈 배열로 설정
        setTechStacks(
          Array.isArray(response.data.techStackResponse)
            ? response.data.techStackResponse
            : []
        );
      } catch (error) {
        console.error("Failed to fetch tech stacks:", error);
        setTechStacks([]); // 오류 발생 시 빈 배열로 초기화
      }
    };

    fetchTechStacks();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollPosition = scrollRef.current.scrollTop;
        const itemHeight = 26;

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
  }, [scrollRef, techStacks]);

  const handleTechStackClick = (techStackName) => {
    setSelectedTechStack(techStackName);

    setSelectedTechStacks((prevSelected) => {
      if (prevSelected.includes(techStackName)) {
        // 이미 선택된 경우 제거
        return prevSelected.filter((name) => name !== techStackName);
      } else {
        // 선택되지 않은 경우 추가
        return [...prevSelected, techStackName];
      }
    });
    setContent(null);
    if (scrollRef.current) {
      const index = techStacks.findIndex(
        (techStack) => techStack.techStackName === techStackName
      );
      const itemHeight = 26;
      scrollRef.current.scrollTop = index * itemHeight;
    }
  };

  const handleClickButton = () => {
    setContent(
      <TechStackList
        techStacks={techStacks}
        scrollRef={scrollRef}
        handleTechStackClick={handleTechStackClick}
      />
    );
  };
  return (
    <div className="teckstackselector-form">
      <svg
        id="custom_image_uploader"
        width="31"
        height="31"
        viewBox="0 0 31 31"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onClick={handleClickButton}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M15.5 0C6.93935 0 0 6.93935 0 15.5C0 24.0606 6.93935 31 15.5 31C24.0606 31 31 24.0606 31 15.5C31 6.93935 24.0606 0 15.5 0ZM21.7 17.05H17.05V21.7C17.05 22.5556 16.3556 23.25 15.5 23.25C14.6444 23.25 13.95 22.5556 13.95 21.7V17.05H9.3C8.4444 17.05 7.75 16.3556 7.75 15.5C7.75 14.6444 8.4444 13.95 9.3 13.95H13.95V9.3C13.95 8.4444 14.6444 7.75 15.5 7.75C16.3556 7.75 17.05 8.4444 17.05 9.3V13.95H21.7C22.5556 13.95 23.25 14.6444 23.25 15.5C23.25 16.3556 22.5556 17.05 21.7 17.05Z"
          fill="#EFEFEF"
        />
      </svg>
      <div className="selectedtechstacks">
        {selectedTechStacks &&
          selectedTechStacks.map((selected) => {
            return <div>{selected}</div>;
          })}
      </div>
      <div>{content}</div>
    </div>
  );
};

export default TechStackSelector;
