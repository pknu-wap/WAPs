// // src/components/ProjectForm.js
// import React from "react";
// import styles from "../../assets/ProjectCreation/ProjectForm.module.css"; // CSS 파일 경로 추가
// import useProjectForm from "../../hooks/ProjectCreation/useProjectForm"; // Custome Hook 경로
// import ImageUploader from "./ImageUploader";
// import YearScroll from "./YearSelector";
// import RadioButton from "./RadioButton";
// import InputForm from "./InputForm";
// import TechStackSelector from "./TechStackSelector";
// import TechStackList from "./TechStackList";
// import TeamMemberInputForm from "./TeamMemberInputForm";

// // 프로젝트 타입
// const projectTypeOptions = ["WEB", "APP", "GAME", "기타"];

// // 팀원 역할
// const roleOptions = [
//   "PM",
//   "Client",
//   "Server",
//   "Designer",
//   "AI",
//   "Game",
//   "Hardware",
//   "FullStack",
//   "기타",
// ];

// // const TeamMemberInput = ({
// //   member,
// //   index,
// //   handleMemberNameChange,
// //   handleMemberImageUpload,
// //   handleRoleChange,
// //   handleMemberNameFocus,
// // }) => (
// //   <div className="team-member">
// //     {/* 팀원 이름 입력 */}
// //     <input
// //       className="input-field"
// //       type="text"
// //       placeholder="팀원 이름"
// //       value={member.name}
// //       onChange={(e) => handleMemberNameChange(e, index)}
// //       onFocus={(e) => handleMemberNameFocus(e, index)}
// //     />
// //     {/* 팀원 이미지 업로드 */}
// //     <input
// //       className="file-input"
// //       type="file"
// //       accept="image/*"
// //       onChange={(e) => handleMemberImageUpload(e, index)}
// //     />
// //     {member.image && (
// //       <img
// //         className="member-image"
// //         src={URL.createObjectURL(member.image)}
// //         alt={`Member ${index + 1} Image`}
// //       />
// //     )}
// //     {/* 팀원 역할 선택 */}
// //     <select
// //       className="select-field"
// //       value={member.role}
// //       onChange={(e) => handleRoleChange(e, index)}
// //     >
// //       <option value="">역할을 선택해주세요</option>
// //       {roleOptions.map((role) => (
// //         <option key={role} value={role}>
// //           {role}
// //         </option>
// //       ))}
// //     </select>
// //   </div>
// // );

// const ProjectForm = ({ onSubmit }) => {
//   // 커스텀 훅 사용
//   const {
//     // 상태
//     teamName,
//     setTeamName,
//     title,
//     setTitle,
//     projectType,
//     setProjectType,
//     content,
//     setContent,
//     summary,
//     setSummary,
//     semester,
//     setSemester,
//     projectYear,
//     setProjectYear,
//     teamMembers,
//     thumbnail,
//     images,
//     techStacks,
//     setTechStacks,
//     selectedTechStacks,
//     setSelectedTechStacks,
//     selectedTechStack,
//     setSelectedTechStack,

//     inputTitle,
//     inputContent,
//     inputSummary,
//     uploading,
//     uploadError,
//     errorMessage,

//     // 핸들러
//     handleImgUpload,
//     handleMemberNameFocus,
//     handleMemberNameChange,
//     handleMemberImageUpload,
//     handleRoleChange,
//     addTeamMember,
//     handleInputLimit,
//     handleSubmit,

//     toggleTechStack,
//   } = useProjectForm();

//   return (
//     <form
//       className={styles.project_form}
//       onSubmit={(e) => handleSubmit(e, onSubmit)}
//     >
//       {/* 썸네일 이미지 업로드 */}
//       <ImageUploader
//         imgText={"메인 이미지 등록"}
//         imgName={thumbnail}
//         errorMessage={errorMessage.thumbnail}
//         handleImgUpload={(file) => handleImgUpload(file, "thumbnail")}
//         type="thumbnail"
//       />
//       {/* 년도 선택 */}
//       <YearScroll setSelectedYear={setProjectYear} selectedYear={projectYear} />

//       {/* 학기 선택 */}
//       <RadioButton
//         labelname={"학기"}
//         name="semester" // 그룹 이름
//         options={["1", "2"]} // 옵션 배열
//         selected={semester} // 선택된 값
//         setSelected={setSemester} // 선택 상태 업데이트 함수
//       />

//       {/* 프로젝트 타입 선택 */}
//       <RadioButton
//         labelname={"프로젝트 타입"}
//         name="projectType"
//         options={projectTypeOptions}
//         selected={projectType}
//         setSelected={setProjectType}
//       />

//       {/* 프로젝트 타입 선택
//       <div className="form-group">
//         <label>프로젝트 타입:</label>
//         <div className="radio-group">
//           {projectTypeOptions.map((type) => (
//             <label key={type} className="radio-option">
//               <input
//                 type="radio"
//                 name="projectType"
//                 value={type}
//                 checked={projectType === type}
//                 onChange={(e) => setProjectType(e.target.value)}
//               />
//               {type}
//             </label>
//           ))}
//         </div>
//         {errorMessage.projectType && (
//           <p className="error-message">{errorMessage.projectType}</p>
//         )}
//       </div> */}

//       {/* 팀명 */}
//       {/* <div className="form-group">
//         <label>팀명:</label>
//         <input
//           name="teamName"
//           className="input-field"
//           type="text"
//           placeholder="팀명을 입력해주세요."
//           maxLength={"20"}
//           value={teamName}
//           onChange={(e) => {
//             setTeamName(e.target.value);
//             handleInputLimit(e);
//           }}
//         />
//         <span className="char-count">{teamName.length}/20</span>
//         {errorMessage.teamName && (
//           <p className="error-message">{errorMessage.teamName}</p>
//         )}
//       </div> */}

//       <InputForm
//         name="teamName"
//         placeholder="팀명"
//         maxLen="20"
//         value={teamName}
//         onChange={(e) => {
//           setTeamName(e.target.value);
//           handleInputLimit(e);
//         }}
//         errorMessage={errorMessage}
//       />

//       <InputForm
//         name="title"
//         placeholder="프로젝트 명"
//         maxLen="20"
//         value={title}
//         onChange={(e) => {
//           setTitle(e.target.value);
//           handleInputLimit(e);
//         }}
//         errorMessage={errorMessage}
//       />

//       {/* 제목 입력 */}
//       {/* <div className="form-group">
//         <label>프로젝트 제목:</label>
//         <input
//           name="title"
//           className="input-field"
//           type="text"
//           placeholder="프로젝트 이름을 입력해주세요."
//           maxLength={"20"}
//           value={title}
//           onChange={(e) => {
//             setTitle(e.target.value);
//             handleInputLimit(e);
//           }}
//         />
//         <span className="char-count">{inputTitle}/20</span>
//         {errorMessage.title && (
//           <p className="error-message">{errorMessage.title}</p>
//         )}
//       </div> */}

//       <InputForm
//         name="summary"
//         placeholder="한줄 소개"
//         maxLen="20"
//         value={summary}
//         onChange={(e) => {
//           setSummary(e.target.value);
//           handleInputLimit(e);
//         }}
//         errorMessage={errorMessage}
//       />

//       {/* 한줄 소개 입력 */}
//       {/* <div className="form-group">
//         <label>한줄 소개:</label>
//         <input
//           name="summary"
//           className="input-field"
//           type="text"
//           placeholder="프로젝트를 한줄로 소개해주세요."
//           value={summary}
//           maxLength={"30"}
//           onChange={(e) => {
//             setSummary(e.target.value);
//             handleInputLimit(e);
//           }}
//         />
//         <span className="char-count">{inputSummary}/30</span>
//         {errorMessage.summary && (
//           <p className="error-message">{errorMessage.summary}</p>
//         )}
//       </div> */}

//       <InputForm
//         name="content"
//         placeholder="상세 설명"
//         maxLen="600"
//         value={content}
//         onChange={(e) => {
//           setContent(e.target.value);
//           handleInputLimit(e);
//         }}
//         errorMessage={errorMessage}
//       />

//       {/* 프로젝트 상세 설명 */}
//       {/* <div className="form-group">
//         <label>프로젝트 상세 설명:</label>
//         <textarea
//           className="textarea-field"
//           name="content"
//           placeholder="프로젝트 상세 설명을 입력해주세요."
//           value={content}
//           maxLength={"600"}
//           onChange={(e) => {
//             setContent(e.target.value);
//             handleInputLimit(e);
//           }}
//           required
//           rows="5"
//         />
//         <span className="char-count">{inputContent}/600</span>
//         {errorMessage.content && (
//           <p className="error-message">{errorMessage.content}</p>
//         )}
//       </div> */}

//       {/* 이미지 업로더들 */}
//       <div className="form-group">
//         <label>이미지 업로드:</label>
//         {images.map((img, index) => (
//           <ImageUploader
//             key={index}
//             imgText={`이미지 등록 ${index + 1}`}
//             imgName={images[index]}
//             errorMessage={errorMessage[`image${index}`]}
//             handleImgUpload={(file) => handleImgUpload(file, "image", index)}
//             type="image"
//           />
//         ))}
//       </div>

//       {/* 팀원 입력 */}
//       <div className="form-group">
//         <label>팀원:</label>
//         {teamMembers.map((member, index) => (
//           <TeamMemberInputForm
//             key={index}
//             member={member}
//             index={index}
//             handleMemberNameChange={handleMemberNameChange}
//             handleMemberImageUpload={handleMemberImageUpload}
//             handleRoleChange={handleRoleChange}
//             handleMemberNameFocus={handleMemberNameFocus}
//             roleOptions={roleOptions}
//             handleImgUpload={handleImgUpload}
//             errorMessage={errorMessage}
//             addTeamMember={addTeamMember}
//             teamMembers={teamMembers}
//           />
//         ))}
//       </div>

//       {/* 기술 스택 선택 */}
//       <TechStackSelector selectedTechStacks={selectedTechStacks} />
//       {/* <TechStackList /> */}

//       {uploadError && <p className="error-message">{uploadError}</p>}

//       {/* 제출 버튼 */}
//       <button
//         type="submit"
//         className={styles.submit_button}
//         disabled={uploading}
//         style={{ marginTop: "20px", marginBottom: "100px", cursor: "pointer" }}
//         onclick={handleSubmit}
//       >
//         제출
//       </button>
//     </form>
//   );
// };

// export default ProjectForm;

// src/components/ProjectForm.js

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
  const handleSubmit = async (e) => {
    e.preventDefault();

    const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/project`;

    // 1. 프로젝트 데이터 JSON으로 전송
    const projectData = {
      title,
      projectType,
      content,
      summary,
      semester: parseInt(semester),
      projectYear: projectYear,
      teamMember: teamMembers.map((member) => ({
        memberName: member.name,
        memberRole: member.role,
      })),
      // techStack: selectedTechStacks.map((stack) => ({
      //   techStackName: "비밀",
      //   techStackType: "아직",
      // })),

      techStack: selectedTechStacks.map((stack, index) => ({
        techStackName: stack,
        techStackType: "기술스택",
      })),
    };

    try {
      // 프로젝트 데이터 전송 (application/json)
      await axios.post(apiUrl, projectData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("프로젝트 데이터 전송 성공");

      // 2. 썸네일 및 이미지 데이터 전송 (multipart/form-data)
      const formData = new FormData();
      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }
      images.forEach((image, index) => {
        if (image) {
          formData.append(`imageFile[${index}]`, image);
        }
      });

      await axios.post(apiUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      resetForm();
      alert("프로젝트가 성공적으로 생성되었습니다.");
    } catch (error) {
      console.log({ selectedTechStacks });
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
