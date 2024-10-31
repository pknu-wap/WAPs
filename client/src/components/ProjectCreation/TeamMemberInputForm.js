import React from "react";
import "../../assets/ProjectCreation/TeamMemberInputForm.css"; // CSS 파일 경로 추가

const TeamMemberInputForm = ({
  member,
  index,
  handleMemberNameChange,
  errorMessage,
  handleImgUpload,
  handleRoleChange,
  handleMemberNameFocus,
  roleOptions,
  addTeamMember,
  handleMemberImageUpload,
  teamMembers,
}) => (
  <div className="team-member">
    {index === teamMembers.length - 1 && (
      <label className="teammember-label">팀원 등록</label>
    )}
    <div className="teammember-form">
      {/* 이미지 업로드 SVG */}
      <div className="image-upload-container">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleMemberImageUpload(e, index)}
          style={{ display: "none" }}
          id={`file-upload-${index}`}
        />
        <label htmlFor={`file-upload-${index}`}>
          <svg
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="image-upload-svg"
          >
            <path
              d="M55 27.5C55 42.6878 42.6878 55 27.5 55C12.3122 55 0 42.6878 0 27.5C0 12.3122 12.3122 0 27.5 0C42.6878 0 55 12.3122 55 27.5Z"
              fill="#4A4A4A"
            />
            <path
              d="M27.5 21C23.9101 21 21 23.9101 21 27.5C21 31.0899 23.9101 34 27.5 34C31.0899 34 34 31.0899 34 27.5C34 23.9101 31.0899 21 27.5 21ZM30.1 28.15H28.15V30.1C28.15 30.4588 27.8588 30.75 27.5 30.75C27.1412 30.75 26.85 30.4588 26.85 30.1V28.15H24.9C24.5412 28.15 24.25 27.8588 24.25 27.5C24.25 27.1412 24.5412 26.85 24.9 26.85H26.85V24.9C26.85 24.5412 27.1412 24.25 27.5 24.25C27.8588 24.25 28.15 24.5412 28.15 24.9V26.85H30.1C30.4588 26.85 30.75 27.1412 30.75 27.5C30.75 27.8588 30.4588 28.15 30.1 28.15Z"
              fill="#232323"
            />
          </svg>
        </label>
        {/* 이미지 프리뷰 */}
        {member.image && (
          <img
            className="member-image"
            src={URL.createObjectURL(member.image)}
            alt={`Member ${index + 1} Image`}
          />
        )}
      </div>

      {/* 팀원 이름 입력 */}
      <input
        className="team-member-input"
        type="text"
        placeholder="팀원 이름"
        value={member.name}
        onChange={(e) => handleMemberNameChange(e, index)}
        onFocus={(e) => handleMemberNameFocus(e, index)}
      />

      {/* 팀원 역할 선택 */}
      <select
        className="role-select-field"
        value={member.role}
        onChange={(e) => handleRoleChange(e, index)}
      >
        <option value="">역할</option>
        {roleOptions.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      {index === teamMembers.length - 1 && (
        <button
          className="add-member-btn"
          type="button"
          onClick={addTeamMember}
        >
          등록
        </button>
      )}
    </div>
  </div>
);
export default TeamMemberInputForm;
