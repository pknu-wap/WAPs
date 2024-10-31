import React from "react";
import axios from "axios";
import styles from "../../assets/ProjectCreation/ProjectForm.module.css";
import useProjectForm from "../../hooks/ProjectCreation/useProjectForm";
import ImageUploader from "./ImageUploader";
import YearScroll from "./YearSelector";
import RadioButton from "./RadioButton";
import InputForm from "./InputForm";
import TechStackSelector from "./TechStackSelector";
import TeamMemberInputForm from "./TeamMemberInputForm";

const projectTypeOptions = ["WEB", "APP", "GAME", "기타"];
const roleOptions = [
  "PM",
  "Client",
  "Server",
  "Designer",
  "AI",
  "Game",
  "Hardware",
  "FullStack",
  "기타",
];

const ProjectForm = () => {
  const {
    // teamName,
    // setTeamName,
    title,
    setTitle,
    projectType,
    setProjectType,
    content,
    setContent,
    summary,
    setSummary,
    semester,
    setSemester,
    projectYear,
    setProjectYear,
    teamMembers,
    thumbnail,
    images,
    selectedTechStacks,
    uploading,
    uploadError,
    errorMessage,
    handleImgUpload,
    handleMemberNameFocus,
    handleMemberNameChange,
    handleMemberImageUpload,
    handleRoleChange,
    addTeamMember,
    handleInputLimit,
    toggleTechStack,
    resetForm,
    validateForm,
  } = useProjectForm();

  // handleSubmit에서 FormData를 사용하여 서버로 데이터 전송
  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/project`;

  //   // 1. 프로젝트 데이터 JSON으로 전송
  //   const projectData = {
  //     title,
  //     projectType,
  //     content,
  //     summary,
  //     semester: parseInt(semester),
  //     projectYear: projectYear,
  //     teamMember: teamMembers.map((member) => ({
  //       memberName: member.name,
  //       memberRole: member.role,
  //     })),
  //     // techStack: selectedTechStacks.map((stack) => ({
  //     //   techStackName: "비밀",
  //     //   techStackType: "아직",
  //     // })),

  //     techStack: selectedTechStacks.map((stack, index) => ({
  //       techStackName: stack,
  //       techStackType: "기술스택",
  //     })),
  //   };

  //   try {
  //     // 프로젝트 데이터 전송 (application/json)
  //     await axios.post(apiUrl, projectData, {
  //       headers: { "Content-Type": "application/json" },
  //     });
  //     console.log("프로젝트 데이터 전송 성공");

  //     // 2. 썸네일 및 이미지 데이터 전송 (multipart/form-data)
  //     const formData = new FormData();
  //     if (thumbnail) {
  //       formData.append("thumbnail", thumbnail);
  //     }
  //     images.forEach((image, index) => {
  //       if (image) {
  //         formData.append(`imageFile[${index}]`, image);
  //       }
  //     });

  //     await axios.post(apiUrl, formData, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //     });

  //     resetForm();
  //     alert("프로젝트가 성공적으로 생성되었습니다.");
  //   } catch (error) {
  //     console.error("프로젝트 생성 실패:", error);
  //     alert("프로젝트 생성에 실패했습니다. 다시 시도해 주세요.");
  //   }
  // };

  const handleSubmit = async (e) => {
    // 기본 이벤트 제거
    e.preventDefault();

    // 서버경로
    const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/project`;

    // formdata 생성
    const formData = new FormData();

    // 프로젝트 데이터 : JSON
    const projectData = {
      title,
      projectType,
      content,
      summary,
      semester: parseInt(semester),
      projectYear,
      teamMember: teamMembers.map((member) => ({
        memberName: member.name,
        memberRole: member.role,
      })),
      techStack: selectedTechStacks.map((stack) => ({
        techStackName: stack.techStackName,
        techStackType: stack.techStackType,
      })),
    };

    // blob 객체에 JSON 데이터 추가
    const blob = new Blob([JSON.stringify(projectData)], {
      type: "application/json",
    });

    // JSON 데이터 추가
    formData.append("project", blob);

    // 썸네일 파일 추가 (단일 파일)
    if (thumbnail) {
      formData.append("thumbnail", thumbnail); // thumbnail의 타입 사용
    }

    // 이미지 파일 리스트 추가 (하나의 키로)
    images.forEach((image) => {
      if (image) {
        formData.append("image", image); // 각 이미지를 개별적으로 추가
      }
    });

    try {
      // 모든 데이터를 한 번에 전송
      await axios.post(apiUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("프로젝트 생성 성공");
      console.log("프로젝트 데이터:", formData.get("project"));

      resetForm();
      alert("프로젝트가 성공적으로 생성되었습니다.");
    } catch (error) {
      console.error("프로젝트 생성 실패:", error);
      alert("프로젝트 생성에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <form className={styles.project_form} onSubmit={handleSubmit}>
      <ImageUploader
        imgText={"메인 이미지 등록"}
        imgName={thumbnail}
        errorMessage={errorMessage.thumbnail}
        handleImgUpload={(file) => handleImgUpload(file, "thumbnail")}
        type="thumbnail"
      />
      <YearScroll setSelectedYear={setProjectYear} selectedYear={projectYear} />
      <RadioButton
        labelname={"학기"}
        name="semester"
        options={["1", "2"]}
        selected={semester}
        setSelected={setSemester}
      />
      <RadioButton
        labelname={"프로젝트 타입"}
        name="projectType"
        options={projectTypeOptions}
        selected={projectType}
        setSelected={setProjectType}
      />
      {/* <InputForm
        name="teamName"
        placeholder="팀명"
        maxLen="20"
        value={teamName}
        onChange={(e) => {
          setTeamName(e.target.value);
          handleInputLimit(e);
        }}
        errorMessage={errorMessage}
      /> */}
      <InputForm
        name="title"
        placeholder="프로젝트 명"
        maxLen="20"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          handleInputLimit(e);
        }}
        errorMessage={errorMessage}
      />
      <InputForm
        name="summary"
        placeholder="한줄 소개"
        maxLen="20"
        value={summary}
        onChange={(e) => {
          setSummary(e.target.value);
          handleInputLimit(e);
        }}
        errorMessage={errorMessage}
      />
      <InputForm
        name="content"
        placeholder="상세 설명"
        maxLen="600"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          handleInputLimit(e);
        }}
        errorMessage={errorMessage}
      />
      <div className="form-group">
        <label>이미지 업로드:</label>
        {images.map((img, index) => (
          <ImageUploader
            key={index}
            imgText={`이미지 등록 ${index + 1}`}
            imgName={images[index]}
            errorMessage={errorMessage[`image${index}`]}
            handleImgUpload={(file) => handleImgUpload(file, "image", index)}
            type="image"
          />
        ))}
      </div>
      <div className="form-group">
        <label>팀원:</label>
        {teamMembers.map((member, index) => (
          <TeamMemberInputForm
            key={index}
            member={member}
            index={index}
            handleMemberNameChange={handleMemberNameChange}
            handleMemberImageUpload={handleMemberImageUpload}
            handleRoleChange={handleRoleChange}
            handleMemberNameFocus={handleMemberNameFocus}
            roleOptions={roleOptions}
            handleImgUpload={handleImgUpload}
            errorMessage={errorMessage}
            addTeamMember={addTeamMember}
            teamMembers={teamMembers}
          />
        ))}
      </div>
      <TechStackSelector
        selectedTechStacks={selectedTechStacks}
        toggleTechStack={toggleTechStack}
      />
      {uploadError && <p className="error-message">{uploadError}</p>}
      <button
        type="submit"
        className={styles.submit_button}
        disabled={uploading}
        style={{ marginTop: "20px", marginBottom: "100px", cursor: "pointer" }}
      >
        제출
      </button>
    </form>
  );
};

export default ProjectForm;
