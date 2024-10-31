import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../../assets/ProjectCreation/TechStackSelector.css";
import "../../assets/ProjectCreation/YearSelector.css";
import TechStackList from "./TechStackList";
import useProjectForm from "../../hooks/ProjectCreation/useProjectForm"; // Adjust the path as necessary

const SelectedTechStacks = ({ selectedTechStacks }) => {
  return (
    <div className="selectedtechstacks">
      {selectedTechStacks.map((selected, index) => (
        <div key={index}>{selected}</div>
      ))}
    </div>
  );
};

const TechStackSelector = () => {
  const [techStacks, setTechStacks] = useState([]);
  const [showTechStackList, setShowTechStackList] = useState(false);
  const scrollRef = useRef(null);

  // Get the toggle function and selected tech stacks from the hook
  const { selectedTechStacks, toggleTechStack } = useProjectForm();

  const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/techStack/list`;

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
        setTechStacks([]); // Reset to an empty array on error
      }
    };

    fetchTechStacks();
  }, [apiUrl]);

  const handleTechStackClick = (techStackName) => {
    toggleTechStack(techStackName); // Call the toggle function from the hook
    setShowTechStackList(false); // Hide the tech stack list after selection
  };

  const handleClickButton = () => {
    setShowTechStackList(true);
  };

  return (
    <div className="teckstackselector-form">
      <label className="techstack-label">기술스택</label>
      <div className="techstack-btn">
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

      <SelectedTechStacks selectedTechStacks={selectedTechStacks} />
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
