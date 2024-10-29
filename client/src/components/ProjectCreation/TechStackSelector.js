import React from "react";
import { useState } from "react";
import "../../assets/ProjectCreation/TechStackSelector.css";

const TechStackSelector = ({ selectedTechStack, setSelectedTechStack }) => {
  return (
    <div className="teckstackselector-form">
      <svg
        id="custom_image_uploader"
        width="31"
        height="31"
        viewBox="0 0 31 31"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ cursor: "pointer" }}
      >
        <path
          d="M15.5 0C6.93935 0 0 6.93935 0 15.5C0 24.0606 6.93935 31 15.5 31C24.0606 31 31 24.0606 31 15.5C31 6.93935 24.0606 0 15.5 0ZM21.7 17.05H17.05V21.7C17.05 22.5556 16.3556 23.25 15.5 23.25C14.6444 23.25 13.95 22.5556 13.95 21.7V17.05H9.3C8.4444 17.05 7.75 16.3556 7.75 15.5C7.75 14.6444 8.4444 13.95 9.3 13.95H13.95V9.3C13.95 8.4444 14.6444 7.75 15.5 7.75C16.3556 7.75 17.05 8.4444 17.05 9.3V13.95H21.7C22.5556 13.95 23.25 14.6444 23.25 15.5C23.25 16.3556 22.5556 17.05 21.7 17.05Z"
          fill="#EFEFEF"
        />
      </svg>
    </div>
  );
};

export default TechStackSelector;
