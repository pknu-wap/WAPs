import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// import Header from "../components/Header";
// import Menu from "../components/Menu";
import FloatingButton from "../components/FloatingButton";
import apiClient from "../utils/api";

const TeamBuildResultPage = () => {
  // 기존 헤더, 인터페이스 관련 함수들. 이후 s디자인에 따라 삭제 유무 정하기
  // const [menuOpen, setMenuOpen] = useState(false);
  // const toggleMenu = () => {
  //   setMenuOpen(!menuOpen);
  // };

  // 상태 관리
  const [teams, setTeams] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [isLoding, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  return (
    <>
      {/* <Header toggleMenu={toggleMenu} /> */}
      {/* <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} /> */}

      <div class="container">
        <div class="header">
          <div class="title-section">
            <div class="page-title">팀빌딩 결과</div>
            <div class="sub">
              총 <b th:text="${#lists.size(teams.getResults())}">0</b>개 팀
            </div>
          </div>
          <button class="back-btn" onclick="goBack()">← 돌아가기</button>
        </div>

        <div class="toolbar">
          <div>
            <div class="search">
              <input id="q" type="text" placeholder="팀명/팀장/팀원/미배정 검색…" oninput="filterCards()" />
              <button class="btn" onclick="clearSearch()">지우기</button>
            </div>
            <div class="search-help">예) "알파", "김개발", "FRONTEND", "홍길동" 같이 검색할 수 있어요.</div>
          </div>
          <div class="sorts">
            <button class="btn" onclick="sortByName()">팀명순</button>
            <button class="btn" onclick="sortBySize()">팀원수순</button>
          </div>
        </div>

        <div th:if="${#lists.isEmpty(teams.getResults())}" class="empty">
          아직 팀 결과가 없어요. 팀빌딩을 완료하면 여기에서 확인할 수 있어요.
        </div>

        <div id="grid" class="grid" th:if="${!#lists.isEmpty(teams.getResults())}">
          {/* 팀 카드 */}
          <div class="card"
            th:each="team : ${teams.getResults()}"
            th:attr="data-key=|${team.teamName} ${team.leader.name} ${#strings.listJoin(team.members.![#this.name], ' ')} ${team.leader.position} ${#strings.listJoin(team.members.![#this.position], ' ')}|">
            <div class="card-header">
              <div class="team-name">
                <span th:text="${team.teamName}">알파</span>
                <span class="badge" th:text="'멤버 ' + ${#lists.size(team.members)} + '명'">멤버 0명</span>
              </div>
              <div class="muted" th:text="'ID #' + ${team.projectId}">ID #0</div>
            </div>

            <div class="leader">
              <div class="pill">
                <strong>팀장</strong>
                <span th:text="${team.leader.name}">김개발</span>
                <span class="muted" th:if="${team.leader.position != null}"
                  th:text="'· ' + ${team.leader.position}">· BACKEND</span>
              </div>
            </div>

            <div>
              <div class="muted" style="margin-bottom:6px;">팀원</div>
              <div class="members">
                <span class="chip" th:each="m : ${team.members}">
                  <span th:text="${m.name}">이프론</span>
                  <span class="muted" th:if="${m.position != null}" th:text="'· ' + ${m.position}">· FRONTEND</span>
                </span>
              </div>
            </div>

            <div th:if="${team.summary != null}" class="muted" th:text="${team.summary}">설명/비고</div>

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
      </div>
      <FloatingButton />
    </>
  );
}

export default TeamBuildResultPage;
