import React, { useEffect, useState } from "react";
import axios from "axios";

const TechStackList = () => {
  const [techStacks, setTechStacks] = useState([]);
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

  return (
    <div>
      <h1>Tech Stack List</h1>
      <ul>
        {techStacks.map((stack, index) => (
          <li key={index}>
            <strong>Name:</strong> {stack.techStackName} <br />
            <strong>Type:</strong> {stack.techStackType}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TechStackList;
