import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import styles from "../../assets/ProjectCreation/ProjectForm.module.css";
import useProjectForm from "../../hooks/ProjectCreation/useProjectForm";
import ImageUploader from "./ImageUploader";
import YearScroll from "./YearSelector";
import RadioButton from "./RadioButton";
import TextInputForm from "./TextInputForm";
import TechStackSelector from "./TechStackSelector";
import TeamMemberInputForm from "./TeamMemberInputForm";
import InputPin from "./InputPin";

// 사용성을 높인 버전의 프로젝트 생성 폼

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

const ProjectFormNew = ({ isEdit = false, existingProject = null }) => {
  const maxImageCount = 4; // 최대 이미지 업로드 개수
  const token = Cookies.get("authToken");
  const {
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
    setThumbnail,
    images,
    setImages,
    selectedTechStacks,
    uploading,
    uploadError,
    errorMessage,
    password,
    handleImgUpload,
    handleRemoveImage,
    handleMemberNameFocus,
    handleMemberNameChange,
    handleMemberImageUpload,
    handleRoleChange,
    addTeamMember,
    handleInputLimit,
    toggleTechStack,
    resetForm,
    setPassword,
    validateForm,
  } = useProjectForm();

  // 기존 데이터 초기화
  useEffect(() => {
    if (isEdit && existingProject) {
      setTitle(existingProject.title || "");
      setProjectType(existingProject.projectType || "");
      setContent(existingProject.content || "");
      setSummary(existingProject.summary || "");
      setSemester(
        existingProject.semester ? existingProject.semester.toString() : ""
      );
      setProjectYear(existingProject.projectYear || new Date().getFullYear());
      setThumbnail(existingProject.thumbnail || null);

      // 존재하는 이미지만 표시
      existingProject.images.forEach((image, index) => {
        setImages((prev) => {
          const newImages = [...prev];
          newImages[index] = image["imageFile"];
          return newImages;
        });
      });
    }
  }, [isEdit, existingProject]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const apiUrl = `${process.env.REACT_APP_API_BASE_URL_PROXY}/api/project`;

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
      password,
    };

    const formData = new FormData();
    formData.append(
      "project",
      new Blob([JSON.stringify(projectData)], { type: "application/json" })
    );

    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    images.forEach((image) => {
      if (image) {
        formData.append("image", image);
      }
    });

    try {
      if (isEdit) {
        await axios.put(`${apiUrl}/${existingProject.id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        alert("프로젝트가 성공적으로 수정되었습니다.");
      } else {
        await axios.post(apiUrl, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        alert("프로젝트가 성공적으로 생성되었습니다.");
      }

      resetForm();
      window.location.reload();
    } catch (error) {
      console.error("프로젝트 요청 실패:", error);
      alert("프로젝트 요청에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <form className={styles.project_form} onSubmit={handleSubmit}>
      <ImageUploader
        imgText={"메인 이미지 등록"}
        imgName={thumbnail}
        errorMessage={errorMessage.thumbnail}
        handleImgUpload={(file) => handleImgUpload(file, "thumbnail")}
        handleRemoveImage={() => handleRemoveImage("thumbnail", null)}
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
      <TextInputForm
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
      <TextInputForm
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
      <TextInputForm
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

      {/* <div className="form-group">
        <label>이미지 업로드:</label>
        {images.map((img, index) => (
          <ImageUploader
            key={index}
            imgText={`이미지 등록 ${index + 1}`}
            imgName={images[index]}
            errorMessage={errorMessage[`image${index}`]}
            handleImgUpload={(file) => handleImgUpload(file, "image", index)}
            handleRemoveImage={() => handleRemoveImage("image", index)}
            type="image"
          />
        ))}
      </div> */}

      <div className={styles.images}>
        {images.map((image, index) => (
          <ImageUploader
            key={index}
            imgText={`이미지 등록 ${index + 1}`}
            imgName={images[index]}
            errorMessage={errorMessage[`image${index}`]}
            handleImgUpload={(file) => handleImgUpload(file, "image", index)}
            handleRemoveImage={() => handleRemoveImage("image", index)}
            type="image"
          />
        ))}

        {/* 남은 업로더 공간 표시 */}
        {Array.from({ length: maxImageCount - images.length }).map(
          (_, index) => (
            <ImageUploader
              key={index}
              imgText={`이미지 등록 ${index + 1}`}
              imgName={images[index]}
              errorMessage={errorMessage[`image${index}`]}
              handleImgUpload={(file) => handleImgUpload(file, "image", index)}
              handleRemoveImage={() => handleRemoveImage("image", index)}
              type="image"
            />
          )
        )}
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

      <InputPin password={password} setPassword={setPassword} />

      {uploadError && <p className="error-message">{uploadError}</p>}

      <button
        type="submit"
        className={styles.submit_button}
        disabled={uploading}
        style={{ marginTop: "20px", marginBottom: "100px", cursor: "pointer" }}
      >
        {isEdit ? "프로젝트 수정" : "프로젝트 생성"}
      </button>
    </form>
  );
};

export default ProjectFormNew;
