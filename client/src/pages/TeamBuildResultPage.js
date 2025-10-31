import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Menu from "../components/Menu";
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
  const [teams, setTeams] = useState([]); // 팀 상태
  const [unassigned, setUnassigned] = useState([]); // 미배정자 상태
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태
  const [searchQuery, setSearchQuery] = useState(""); // 검색창 문자열 상태
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };


  // 데이터 로딩
  useEffect(() => {
    const fetchTeamBuildResult = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get("/team-build/results");

        setTeams(response.data.results || []);
        setUnassigned(response.data.unassigned || []);
      } catch (err) {
        console.error("Failed to fetch team build result:", err);
        setError("데이터를 불러오는데 실패하였습니다. 해당 학기에 결과가 없을 수 있습니다.");
        setTeams([]); // 에러 발생 시 기존 데이터 초기화
        setUnassigned([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeamBuildResult();
  }, []);

  // 검색 및 정렬 로직 
  const filteredAndSortedTeams = useMemo(() => {
    const filtered = teams.filter(team => {
      const leaderName = team.leader?.name || '';
      const leaderPos = team.leader?.position || '';
      const memberNames = team.members?.map(m => m.name).join(' ') || '';
      const memberPos = team.members?.map(m => m.position).join(' ') || '';

      const searchKey = `${team.teamName} ${leaderName} ${memberNames} ${leaderPos} ${memberPos}`.toLowerCase();
      return searchKey.includes(searchQuery.toLowerCase());
    });

    if (sortBy === 'name') {
      return [...filtered].sort((a, b) => {
        return a.teamName.localeCompare(b.teamName, 'ko');
      });
    }

    // 'default' 상태이거나 다른 상태일 경우, 필터링된 원본 순서(API 순서) 반환
    return filtered;
  }, [teams, searchQuery, sortBy]);


  // 미배정자 정렬
  const filteredUnassigned = useMemo(() => {
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

  // 미배정자 이동 헨들러
  const handleMoveUnassigned = () => {
    document.getElementById('scrollTarget')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSortByName = () => {
    setSortBy(prevSortBy => (prevSortBy === 'name' ? 'default' : 'name'));
  };
  // 렌더링 
  const renderContent = () => {
    if (isLoading) {
      return <div className={styles.loadingContainer}><img src={LoadingImage} alt="Loading..." className={styles.loadingImage} /></div>;
    }
    if (error) {
      return <div className={styles.empty}>{error}</div>;
    }
    return (
      <>
        {/* 팀 카드 그리드 */}
        {filteredAndSortedTeams.length === 0 && searchQuery === "" ? (
          <div className={styles.empty}>해당 학기의 팀 빌딩 결과가 없습니다.</div>
        ) : filteredAndSortedTeams.length === 0 && searchQuery !== "" ? (
          <div className={styles.empty}>검색 결과가 없습니다.</div>
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

                <div>

                  <div className={styles.members}>
                    <strong>팀장 |</strong>
                    <span>{team.leader.name}</span>
                    {team.leader.position && <span className={styles.muted}>· {team.leader.position}</span>}
                  </div>
                  <br />
                  <div className={styles.members}>
                    <strong>팀원 |</strong>
                    {team.members.map(m => (
                      <span key={m.name}>
                        <span>{m.name}</span>
                        {m.position && <span className={styles.roll}> {m.position}</span>}
                      </span>
                    ))}
                  </div>

                </div>

                <div className={styles.footer}>
                  <div div className={styles.summary} >
                    {team.summary && <div className={styles.muted}>{team.summary}</div>}
                    <div className={styles.muted}>
                      총 인원: <b>{1 + team.members.length}</b>명 (팀장 포함)
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button className={`${styles.btn} ${styles.copy}`} onClick={() => handleCopyRoster(team)}>명단 복사</button>
                  </div>
                </div>
              </div >
            ))}
          </div >
        )}

        {/* 미배정 지원자 그리드 */}
        <div id="scrollTarget" className={styles.sectionTitle}>미배정 지원자</div>
        <div className={styles.sectionSub}>
          총 <b>{filteredUnassigned.length}</b>명
        </div>

        {
          filteredUnassigned.length === 0 ? (
            <div className={styles.empty}>모든 지원자가 팀에 배정되었습니다 🎉</div>
          ) : (
            <div className={styles.grid}>
              {filteredUnassigned.map(m => (
                <div className={styles.card} key={m.name}>
                  <div className={styles.cardHeader}>
                    <div className={styles.teamName}>
                      <span>{m.name}</span>
                      <span className={styles.badge}>{m.position}</span>
                    </div>
                    <div className={styles.muted}>미배정</div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </>
    );
  };


  return (
    <>
      <Header toggleMenu={toggleMenu} />
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <main>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.titleSection}>
              <div className={styles.pageTitle}>TEAM BUILDING RESULTS</div>
              <div className={styles.titleSub}>팀빌딩 결과를 확인하세요</div>

            </div>
            {/* 돌아가기 키 도 일단 보류
          <button className={styles.backBtn} onClick={goBack}>← 돌아가기</button> */}
          </div>

          <div className={styles.toolbar}>
            <div>
              <div className={styles.search}>
                <input
                  type="text"
                  placeholder="팀명/팀장/팀원/미배정 검색…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.sorts}>
              <button
                className={`${styles.btn} ${sortBy === 'name' ? styles.activeSort : ''}`}
                onClick={handleSortByName}
              >
                팀명순
              </button>
              <button className={styles.btn} onClick={handleMoveUnassigned}>미배정</button>
            </div>
          </div>

          {renderContent()}

          <FloatingButton />
        </div>
      </main>
    </>

  );
};

export default TeamBuildResultPage;
