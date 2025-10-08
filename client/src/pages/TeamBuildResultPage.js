import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// import Header from "../components/Header";
// import Menu from "../components/Menu";
import FloatingButton from "../components/FloatingButton";
import apiClient from "../utils/api";
import styles from "../assets/TeamBuildResult.module.css";
import LoadingImage from "../assets/img/WAP_white_NoBG.png";

const TeamBuildResultPage = () => {
  // 기존 헤더, 인터페이스 관련 함수들. 이후 s디자인에 따라 삭제 유무 정하기
  // const [menuOpen, setMenuOpen] = useState(false);
  // const toggleMenu = () => {
  //   setMenuOpen(!menuOpen);
  // };
  const navigate = useNavigate();
  // 상태 관리
  const [teams, setTeams] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [isLoding, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // 검색창 문자열 상태관리
  const [sortBy, setSortBy] = useState("name"); // 'name' 또는 'size'

  // 데이터 로딩
  useEffect(() => {
    const fetchTeamBuildResult = async () => {
      try {
        const response = await apiClient.get("vote/result");
        setTeams(response.data.teams.result || []);
        setUnassigned(response.data.unassigned || []);
      } catch (err) {
        console.error("Failed to fetch team build result:", err);
        setError("데이터를 불러오는 데 실패헀습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeamBuildResult();
  }, []);

  // 검색 및 정렬 로직 
  const filteredAndSortedTeams = useMemo(() => {
    const filtered = teams.filter(team => {
      // 검색을 위한 키들
      const searchKey = `${team.teamName} ${team.leader.name} ${team.members.map(m => m.name).join(' ')} ${team.leader.position} ${team.members.map(m => m.position).join(' ')}`.toLowerCase();
      // 해당 키가 포함된 값들을 반환
      return searchKey.includes(searchQuery.toLowerCase());
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.teamName.localeCompare(b.teamName, 'ko');
      }
      if (sortBy === 'size') {
        return (b.members.length + 1) - (a.members.length + 1);
      }
      return 0;
    });
  }, [teams, searchQuery, sortBy]);


  // 미배정자 정렬
  const filteredUnassingned = useMemo(() => {
    return unassigned.filter(member => {
      const searchKey = `${member.name} ${member.position} 미배정`.toLowerCase();
      return searchKey.includes(searchQuery.toLowerCase());
    });
  }, [unassigned, searchQuery]);

  // 팀 명단 복사 이벤트 헨들러
  const handleCopyRoster = (team) => {
    const rosterText = `팀명: ${team.teamName} / 팀장: ${team.leader.name}${team.leader.position ? `·${team.leader.position}` : ''} / 팀원: ${team.members.map(m => `${m.name}${m.position ? `·${m.position}` : ''}`).join(', ')}`;

    navigator.clipboard.writeText(rosterText).then(() => {
      alert("팀 명단이 복사되었습니다!");
    }).catch(err => {
      console.error("Could not copy text: ", err);
    });
  };

  // 돌아가기 버튼을 위한 함수
  const goBack = () => {
    navigate('/HomePage');
  }

  // 렌더링
  if (isLoding) {
    return <div><img src={LoadingImage} alt="Loading..."></img></div>;
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <>
      {/* <Header toggleMenu={toggleMenu} /> */}
      {/* <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} /> */}

      <div className={styles.container}>
        {/* 헤더 부분 */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div className={styles.pageTitle}>팀빌딩 결과</div>
            <div className={styles.sub}>
              총 <b>{filteredAndSortedTeams.length}</b>개 팀
            </div>
          </div>
          <button className={styles.backBtn} onClick={goBack}>← 돌아가기</button>
        </div>

        {/* 검색창 및 정렬*/}
        <div className={styles.toolbar}>
          <div>
            <div className={styles.search}>
              <input
                type="text"
                placeholder="팀명/팀장/팀원/미배정 검색…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className={styles.btn} onClick={() => setSearchQuery("")}>지우기</button>
            </div>
            <div className={styles.searchHelp}>예) "알파", "김개발", "FRONTEND", "홍길동" 같이 검색할 수 있어요.</div>
          </div>
          <div className={styles.sorts}>
            <button className={styles.btn} onClick={() => setSortBy('name')}>팀명순</button>
            <button className={styles.btn} onClick={() => setSortBy('size')}>팀원수순</button>
          </div>
        </div>

        {/* 카드 그리드 */}
        {filteredAndSortedTeams.length === 0 ? (
          <div className={styles.empty}>아직 팀 결과가 없어요. 팀빌딩을 완료하면 여기에서 확인할 수 있어요.</div>
        ) : (
          <div className={styles.grid}>
            {filteredAndSortedTeams.map(team => (
              <div className={styles.card} key={team.projectId}>
                <div className={styles.cardHeader}>
                  <div className={styles.teamName}>
                    <span>{team.teamName}</span>
                    <span className={styles.badge}>멤버 {team.members.length}명</span>
                  </div>
                  <div className={styles.muted}>ID #{team.projectId}</div>
                </div>
                <div className={styles.leader}>
                  <div className={styles.pill}>
                    <strong>팀장</strong>
                    <span>{team.leader.name}</span>
                    {team.leader.position && <span className={styles.muted}>· {team.leader.position}</span>}
                  </div>
                </div>
                <div>
                  <div className={`${styles.muted} ${styles.label}`}>팀원</div>
                  <div className={styles.members}>
                    {team.members.map(m => (
                      <span className={styles.chip} key={m.name}>
                        <span>{m.name}</span>
                        {m.position && <span className={styles.muted}>· {m.position}</span>}
                      </span>
                    ))}
                  </div>
                </div>
                {team.summary && <div className={styles.muted}>{team.summary}</div>}
                <div className={styles.footer}>
                  <div className={styles.muted}>
                    총 인원: <b>{1 + team.members.length}</b>명 (팀장 포함)
                  </div>
                  <div className={styles.actions}>
                    <button className={`${styles.btn} ${styles.copy}`} onClick={() => handleCopyRoster(team)}>명단 복사</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}




        <div id="grid" class="grid" th:if="${!#lists.isEmpty(teams.getResults())}">

          {/* 복사용 숨김 텍스트 */}
          <div class="rosterText" style="display:none;">
            <span th:text="'팀명: ' + ${team.teamName}"></span>
            <span> / </span>
            <span th:text="'팀장: ' + ${team.leader.name} + (${team.leader.position} != null ? '·' + ${team.leader.position} : '')"></span>
            <span> / 팀원: </span>
            <span th:each="m, stat : ${team.members}">
              <span th:text="${m.name} + (${m.position} != null ? '·' + ${m.position} : '')"></span>
              <span th:if="${!stat.last}">, </span>
            </span>
          </div>

          <div class="footer">
            <div class="muted">
              총 인원: <b th:text="${1 + #lists.size(team.members)}">0</b>명 (팀장 포함)
            </div>
            <div class="actions">
              <button class="btn copy" onclick="copyRoster(this)">명단 복사</button>
            </div>
          </div>
        </div>
      </div>

      {/* 미배정 지원자 섹션 */}
      <div class="section-title">미배정 지원자</div>
      <div class="section-sub">
        총 <b th:text="${unassigned != null ? #lists.size(unassigned) : 0}">0</b>명
      </div>

      <div th:if="${unassigned == null || #lists.isEmpty(unassigned)}" class="empty">
        모든 지원자가 팀에 배정되었습니다 🎉
      </div>

      <div id="unassignedGrid" class="grid" th:if="${unassigned != null && !#lists.isEmpty(unassigned)}">
        <div class="card"
          th:each="m : ${unassigned}"
          th:attr="data-key=|${m.name} ${m.position} 미배정|">
          <div class="card-header">
            <div class="team-name">
              <span th:text="${m.name}">홍길동</span>
              <span class="badge" th:text="${m.position}">FRONTEND</span>
            </div>
            <div class="muted">미배정</div>
          </div>
        </div>
      </div>
    </div >
      <FloatingButton />
    </>
  );
}

export default TeamBuildResultPage;
