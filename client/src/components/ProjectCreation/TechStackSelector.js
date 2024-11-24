import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "../../assets/ProjectCreation/TechStackSelector.module.css";
import TechStackList from "./TechStackList";

const SelectedTechStacks = ({ selectedTechStacks, toggleTechStack }) => {
  const handleRemoveTechStack = (techStack) => {
    toggleTechStack(techStack); // toggleTechStack에서 제거하는 기능을 구현
  };

  return (
    <div className={styles.techstack_select}>
      {selectedTechStacks.map((selected, index) => (
        <div key={index} className={styles.selected_tech_stack}>
          <span>
            {selected.techStackName} - {selected.techStackType}
          </span>
          <button
            className={styles.remove_button}
            onClick={() => handleRemoveTechStack(selected)} // 취소 버튼 클릭 시 제거
          >
            X
          </button>
        </div>
      ))}
    </div>
  );
};

const TechStackSelector = ({ selectedTechStacks, toggleTechStack }) => {
  const [techStacks, setTechStacks] = useState([]);
  const [showTechStackList, setShowTechStackList] = useState(false);
  const scrollRef = useRef(null);

  const apiUrl = `${process.env.REACT_APP_API_BASE_URL_PROXY}/api/techStack/list`;

  useEffect(() => {
    const fetchTechStacks = async () => {
      try {
        const response = await axios.get(apiUrl);
        setTechStacks(
          Array.isArray(response.data.techStackResponse)
            ? response.data.techStackResponse
            : []
        );
      } catch (error) {
        console.error("Failed to fetch tech stacks:", error);
        setTechStacks([]);
      }
    };

    fetchTechStacks();
  }, [apiUrl]);

  const handleTechStackClick = (techStack) => {
    toggleTechStack(techStack); // 전체 객체를 전달
    setShowTechStackList(false); // 리스트 숨김
  };

  const handleClickButton = () => {
    setShowTechStackList(true);
  };

  return (
    <div className={styles.teckstack_form}>
      <label className={styles.techstack_label}>기술스택</label>

      <SelectedTechStacks
        selectedTechStacks={selectedTechStacks}
        toggleTechStack={toggleTechStack}
      />
      <div className={styles.techstack_btn}>
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
      </div>

      <div>
        {showTechStackList && (
          <TechStackList
            techStacks={techStacks}
            scrollRef={scrollRef}
            handleTechStackClick={handleTechStackClick}
          />
        )}
      </div>
    </div>
  );
};

export default TechStackSelector;
