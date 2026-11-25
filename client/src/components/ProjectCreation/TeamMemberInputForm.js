import React, { useRef } from "react";
import styles from "../../assets/ProjectCreation/TeamMemberInputForm.module.css"; // CSS 파일 경로 추가

const TeamMemberInputForm = ({
  member,
  index,
  handleMemberNameChange,
  handleRoleChange,
  roleOptions,
  addTeamMember,
  teamMembers,
  handleRemoveTeamMember,
}) => {
  const roleRef = useRef(null);

  return (
    <div className={styles.teammember}>
      <div className={styles.teammember_form}>
        {/* 팀원 이름 입력 */}
        <input
          className={styles.teammember_input}
          type="text"
          aria-label={`팀원 ${index + 1} 이름`}
          placeholder="팀원 이름"
          value={member.memberName || ""}
          onChange={(e) => handleMemberNameChange(e, index)}
        />

        {/* 팀원 역할 선택 */}
        <select
          ref={roleRef}
          required={Boolean(member.memberName)}
          className={styles.teammember_role_select_field}
          aria-label={`팀원 ${index + 1} 역할`}
          value={member.memberRole || ""}
          onChange={(e) => handleRoleChange(e, index)}
        >
          <option value="">역할</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        {/* 삭제 버튼 */}
        {/*등록된 팀원인 경우에만 삭제 버튼 표시 */}
        {(index !== teamMembers.length - 1 ||
          member.memberName ||
          member.memberRole) && (
          <button
            className={styles.teammember_remove_btn}
            type="button"
            aria-label={`팀원 ${index + 1} 삭제`}
            onClick={() => handleRemoveTeamMember(index)}
          >
            삭제
          </button>
        )}
      </div>
      {/* 팀원 추가 버튼 */}
      {index === teamMembers.length - 1 && (
        <button
          className={styles.teammember_add_btn}
          type="button"
          disabled={!(member.memberName || "").trim()}
          onClick={() => {
            if (roleRef.current.reportValidity()) addTeamMember();
          }}
        >
          팀원 추가
        </button>
      )}
    </div>
  );
};
export default TeamMemberInputForm;
