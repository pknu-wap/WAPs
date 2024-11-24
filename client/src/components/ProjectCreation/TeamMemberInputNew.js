import React, { useState } from "react";
import styles from "../../assets/ProjectCreation/TeamMemberInputForm.module.css"; // CSS 파일 경로 추가

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

const TeamMemberInputNew = ({ initialTeamMember = [] }) => {
  const [teamMembers, setTeamMembers] = useState(initialTeamMember);
  const [newMember, setNewMember] = useState({
    memberName: "",
    memberRole: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddMember = () => {
    if (newMember.memberName && newMember.memberRole) {
      const updatedMembers = [...teamMembers, newMember];
      setTeamMembers(updatedMembers); // 팀원 목록 업데이트
      setNewMember({ memberName: "", memberRole: "" }); // 입력 초기화
    }
  };

  return (
    <div className={styles.teamMemberInput}>
      <h3>팀원 추가</h3>

      {/* 팀원 이름 입력 */}
      <input
        type="text"
        name="memberName"
        value={newMember.memberName}
        onChange={handleInputChange}
        placeholder="팀원 이름"
      />

      {/* 팀원 역할 선택 */}
      <select
        name="memberRole"
        value={newMember.memberRole}
        onChange={handleInputChange}
      >
        <option value="">역할 선택</option>
        {roleOptions.map((role, index) => (
          <option key={index} value={role}>
            {role}
          </option>
        ))}
      </select>

      {/* 추가 버튼 */}
      <button onClick={handleAddMember}>팀원 추가</button>

      <div className={styles.teamMemberList}>
        {teamMembers.length > 0 && (
          <ul>
            {teamMembers.map((member, index) => (
              <li key={index}>
                {member.memberName} - {member.memberRole}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeamMemberInputNew;
