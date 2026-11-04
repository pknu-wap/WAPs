import React, { useState } from "react";
import styles from "../../assets/ProjectCreation/TeamMemberInputForm.module.css"; // CSS 파일 경로 추가

const TeamMemberInputForm = ({
  member,
  index,
  handleMemberSelect,
  memberOptions,
  membersLoading,
  handleRoleChange,
  roleOptions,
  addTeamMember,
  teamMembers,
  handleRemoveTeamMember,
}) => {
  const [query, setQuery] = useState("");
  const options = memberOptions.filter(
    (option) =>
      option.userId === member.userId ||
      (option.memberName.includes(query.trim()) &&
        !teamMembers.some(
          (selected, selectedIndex) =>
            selectedIndex !== index && selected.userId === option.userId,
        )),
  );
  return (
    <div className={styles.teammember}>
      {index === teamMembers.length - 1 && (
        <label className={styles.teammember_label}>팀원 등록</label>
      )}
      <div className={styles.teammember_form}>
        <div className={styles.member_picker}>
          <input
            className={styles.teammember_input}
            aria-label={`팀원 ${index + 1} 검색`}
            placeholder="이름으로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={membersLoading}
          />
          <select
            className={styles.member_select}
            aria-label={`팀원 ${index + 1} 선택`}
            value={member.userId || ""}
            disabled={membersLoading}
            onChange={(event) =>
              handleMemberSelect(
                memberOptions.find(
                  (option) => String(option.userId) === event.target.value,
                ),
                index,
              )
            }
          >
            <option value="">
              {membersLoading ? "회원 목록 로딩 중..." : "회원을 선택해 주세요"}
            </option>
            {member.userId &&
              !memberOptions.some(
                (option) => option.userId === member.userId,
              ) && (
                <option value={member.userId} disabled>
                  {member.memberName} (다시 선택 필요)
                </option>
              )}
            {options.map((option) => (
              <option key={option.userId} value={option.userId}>
                {option.memberName} (#{option.userId})
              </option>
            ))}
          </select>
          {!membersLoading && options.length === 0 && (
            <span role="status">선택할 회원이 없습니다.</span>
          )}
          {member.memberName && !member.userId && (
            <span role="status">
              {member.memberName}: 회원을 다시 선택해 주세요.
            </span>
          )}
        </div>

        {/* 팀원 역할 선택 */}
        <select
          className={styles.teammember_role_select_field}
          aria-label={`팀원 ${index + 1} 역할`}
          value={member.memberRole}
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
          member.userId ||
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
        {/* 등록 버튼 */}
        {index === teamMembers.length - 1 && (
          <button
            className={styles.teammember_add_btn}
            type="button"
            disabled={!member.userId || !member.memberRole}
            onClick={addTeamMember}
          >
            등록
          </button>
        )}
      </div>
    </div>
  );
};
export default TeamMemberInputForm;
