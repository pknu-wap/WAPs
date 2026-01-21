import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { projectApi } from "../../api/project";
import Cookies from "js-cookie";
import styles from "../../assets/ProjectCreation/ProjectForm.module.css";
import useProjectForm from "../../hooks/ProjectCreation/useProjectForm";
import ImageUploader from "./ImageUploader";
import YearScroll from "./YearSelector";
import RadioButton from "./RadioButton";
import TextInputForm from "./TextInputForm";
import TechStackSelector from "./TechStackSelector";
import TeamMemberInputForm from "./TeamMemberInputForm";
// import TeamMemberInputNew from "./TeamMemberInputNew";
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
  const { projectId } = useParams();
  const maxImageCount = 4; // 최대 이미지 업로드 개수
  const navigate = useNavigate(); // navigate 함수
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
    setTeamMembers,
    thumbnail,
    setThumbnail,
    images,
    setImages,
    selectedTechStacks,
    setSelectedTechStacks,
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
    handleRemoveTeamMember,
    handleInputLimit,
    toggleTechStack,
    resetForm,
    setPassword,
    // validateForm,
    removalList,
    // setRemovalList,
  } = useProjectForm();

  // 기존 데이터 초기화
  useEffect(() => {
    if (isEdit && existingProject) {
      setThumbnail(existingProject.thumbnail || null);
      setProjectYear(existingProject.projectYear || new Date().getFullYear());
      setSemester(existingProject.semester || 1);
      setProjectType(existingProject.projectType || "");
      setTitle(existingProject.title || "");
      setSummary(existingProject.summary || "");
      setContent(existingProject.content || "");
      // 이미지 처리
      if (Array.isArray(existingProject.images)) {
        setImages(existingProject.images.map((img) => img.imageFile));
      }
      // 멤버가 존재하면 추가
      if (Array.isArray(existingProject.teamMember)) {
        setTeamMembers(existingProject.teamMember.map((member) => member));
      }
      setSelectedTechStacks(existingProject.techStack || []);
      setPassword("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existingProject]);



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      alert("비밀번호를 입력해 주세요.");
      return;
    }

    const formData = new FormData();
    const projectData = {
      title,
      projectType,
      content,
      summary,
      semester,
      projectYear,
      teamMember: teamMembers.map((member) => ({
        memberName: member.memberName,
        memberRole: member.memberRole,
      })),
      techStack: selectedTechStacks.map((stack) => ({
        techStackName: stack.techStackName,
        techStackType: stack.techStackType,
      })),
      password,
    };
    const editedProjectData = {
      ...projectData,
      removal: removalList,
    };
    const blob = new Blob([
      JSON.stringify(isEdit ? editedProjectData : projectData),
    ], { type: "application/json" });
    formData.append("project", blob);
    if (thumbnail instanceof File) {
      formData.append("thumbnail", thumbnail);
    }
    images.forEach((image) => {
      if (image instanceof File) {
        formData.append("image", image);
      }
    });
    try {
      if (isEdit) {
        await projectApi.updateProject(projectId, formData);

        alert("프로젝트가 성공적으로 수정되었습니다.");
        navigate(`/project/${projectId}`);
      } else {
        await projectApi.createProject(formData);
        alert("프로젝트가 성공적으로 생성되었습니다.");
        navigate(`/ProjectPage`);
      }
      resetForm();
    } catch (error) {
      alert("프로젝트 요청에 실패했습니다. 다시 시도해 주세요.");
      if (error.response) {
        // 네트워크 에러 등은 콘솔에만 출력
        // console.error("에러 응답 코드:", error.response.status);
        // console.error("에러 메시지:", error.response.data);
      }
    }
  };

  return (
    <form
      className={`${styles.project_form} ${styles.mount1}`}
      onSubmit={handleSubmit}
    >
      <ImageUploader
        imgText={"메인 이미지 등록"}
        imgName={thumbnail}
        errorMessage={errorMessage.thumbnail}
        handleImgUpload={(file) => handleImgUpload(file, "thumbnail")}
        handleRemoveImage={() => handleRemoveImage("thumbnail", null)}
        type="thumbnail"
      />
      <YearScroll
        selectedYear={{ projectYear, semester }}  // 전달
        setSelectedYear={(yearData) => {           // 객체를 받아서 분리
          setProjectYear(yearData.projectYear);
          setSemester(yearData.semester);
        }}
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
        maxLen="80"
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
        maxLen="3000"
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
        {/* {images.map((image, index) => (
          <ImageUploader
            key={index}
            imgText={`이미지 등록 ${index + 1}`}
            imgName={images[index]}
            errorMessage={errorMessage[`image${index}`]}
            handleImgUpload={(file) => handleImgUpload(file, "image", index)}
            handleRemoveImage={() => handleRemoveImage("image", index)}
            type="image"
          />
        ))} */}

        {/* 남은 업로더 공간 표시 */}
        {/* {Array.from({ length: maxImageCount - images.length }).map(
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
        )} */}

        {Array.from({ length: maxImageCount }).map((_, index) => (
          <ImageUploader
            key={index}
            index={index} // 삭제용 index 전달
            imgText={`이미지 등록 ${index + 1}`}
            imgName={images[index] || null}
            errorMessage={errorMessage[`image${index}`]}
            handleImgUpload={(file) => handleImgUpload(file, "image", index)}
            handleRemoveImage={(i) => handleRemoveImage("image", i)}
            type="image"
          />
        ))}
      </div>
      <div className="form-group">
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
            handleRemoveTeamMember={handleRemoveTeamMember}
            teamMembers={teamMembers}
            setTeamMembers={setTeamMembers}
          />
        ))}
      </div>

      {/* <div className="form-group">
        <label>팀원:</label>
        {teamMembers.map((member, index) => (
          <TeamMemberInputNew initialTeamMember={teamMembers} />
        ))}
      </div> */}

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
