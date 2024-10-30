import React from "react";
import "../../assets/ProjectCreation/YearSelector.css"; // CSS 파일 경로 추가

const TechStackList = ({ techStacks, scrollRef, handleTechStackClick }) => {
  return (
    <div className="year-selector">
      <div className="scroll-container" ref={scrollRef}>
        {techStacks &&
          techStacks.map((techStack) => (
            <p
              key={techStack.techStackName}
              className={`year-item ${techStack.techStackName}`}
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
