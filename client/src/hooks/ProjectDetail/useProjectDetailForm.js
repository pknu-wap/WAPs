import { useState } from "react";

const useProjectDetailForm = () => {
  const [thumnail_image, setThumnail_image] = useState();
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [semester, setSemester] = useState("");

  const [projectYear, setProjectYear] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [techStacks, setTechStacks] = useState([]);
  const [images, setImages] = useState([null, null, null, null]);

  return {
    thumnail_image,
    setThumnail_image,
    title,
    setTitle,
    projectType,
    setProjectType,
    summary,
    setSummary,
    content,
    setContent,
    semester,
    setSemester,
    projectYear,
    setProjectYear,
    teamMembers,
    setTeamMembers,
    techStacks,
    setTechStacks,
    images,
    setImages,
  };
};
export default useProjectDetailForm;
