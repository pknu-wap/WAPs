import React, { useId, useRef, useState } from "react";
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
  const [query, setQuery] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const roleRef = useRef(null);
  const matches = memberOptions.filter(
    (option) =>
      option.memberName.includes((query || "").trim()) &&
      !teamMembers.some(
        (selected, selectedIndex) =>
          selectedIndex !== index && selected.userId === option.userId,
      ),
  );
  const selectMember = (option) => {
    handleMemberSelect(option, index);
    setQuery(null);
    setExpanded(false);
    setActiveIndex(-1);
  };
  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") event.preventDefault();
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setExpanded(false);
      setQuery(null);
      setActiveIndex(-1);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setExpanded(true);
      setActiveIndex((current) =>
        event.key === "ArrowDown"
          ? Math.min(current + 1, matches.length - 1)
          : Math.max(current - 1, 0),
      );
    } else if (event.key === "Enter") {
      if (expanded && matches[activeIndex]) selectMember(matches[activeIndex]);
      else if (query?.trim() && matches.length === 1) selectMember(matches[0]);
      else setExpanded(true);
    }
  };
  return (
    <div className={styles.teammember}>
      <div className={styles.teammember_form}>
        <div className={styles.member_picker}>
          <input
            className={styles.teammember_input}
            role="combobox"
            aria-label={`팀원 ${index + 1} 검색`}
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={expanded ? listId : undefined}
            aria-activedescendant={
              expanded && matches[activeIndex]
                ? `${listId}-${matches[activeIndex].userId}`
                : undefined
            }
            autoComplete="off"
            placeholder={
              membersLoading ? "회원 목록 로딩 중..." : "이름으로 검색"
            }
            value={
              query ??
              (member.userId
                ? `${member.memberName} (#${member.userId})`
                : member.memberName || "")
            }
            onFocus={() => setExpanded(true)}
            onClick={() => setExpanded(true)}
            onBlur={() => {
              setExpanded(false);
              setQuery(null);
              setActiveIndex(-1);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setExpanded(true);
              setActiveIndex(-1);
            }}
            onKeyDown={handleSearchKeyDown}
            disabled={membersLoading}
          />
          {expanded && (
            <ul
              id={listId}
              role="listbox"
              aria-label={`팀원 ${index + 1} 선택`}
              className={styles.member_results}
            >
              {matches.map((option, optionIndex) => (
                <li
                  id={`${listId}-${option.userId}`}
                  key={option.userId}
                  role="option"
                  aria-selected={member.userId === option.userId}
                  className={
                    optionIndex === activeIndex
                      ? styles.active_option
                      : undefined
                  }
                  ref={(node) => {
                    if (optionIndex === activeIndex)
                      node?.scrollIntoView?.({ block: "nearest" });
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectMember(option)}
                >
                  {option.memberName} (#{option.userId})
                </li>
              ))}
              {!matches.length && (
                <li role="presentation">선택할 회원이 없습니다.</li>
              )}
            </ul>
          )}
          {member.memberName &&
            !membersLoading &&
            !memberOptions.some(
              (option) => option.userId === member.userId,
            ) && (
              <span role="status">
                {member.memberName}: 회원을 다시 선택해 주세요.
              </span>
            )}
        </div>

        {/* 팀원 역할 선택 */}
        <select
          ref={roleRef}
          required={Boolean(member.userId || member.memberName)}
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
      </div>
      {/* 팀원 추가 버튼 */}
      {index === teamMembers.length - 1 && (
        <button
          className={styles.teammember_add_btn}
          type="button"
          disabled={!member.userId}
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
