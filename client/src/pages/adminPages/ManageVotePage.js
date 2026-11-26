import { useState, useEffect } from "react";
import styles from "../../assets/Admin/ManageVote.module.css";
import { adminVoteApi } from "../../api/admin";
import { projectApi } from "../../api/project";
import { getCurrentSemester } from "../../utils/dateUtils";
import SubmitModal from "./SubmitModal";
const HeaderSection = ({ semester, isProcessing, voteStatus, onClick }) => {
  const isOpenButton = voteStatus === "NOT_CREATED";
  const isCloseButton = voteStatus === "VOTING";
  const isDeleteButton = voteStatus === "ENDED";

  return (
    <div>
      <div className={styles.upperLeft}>
        <div>
          <h1 className={styles.pageTitle}>투표 관리</h1>
          <div className={styles.semesterRow}>
            <span className={styles.voteSemester}>{semester} 학기</span>
            <span className={styles.status}>
              {isOpenButton ? "준비 중" : isCloseButton ? "진행 중" : "종료"}
            </span>
          </div>
        </div>
        <button
          disabled={
            isProcessing || (!isOpenButton && !isCloseButton && !isDeleteButton)
          }
          onClick={onClick}
          className={
            isOpenButton ? styles.openBtn : styles.closeBtn
          }
        >
          {isDeleteButton
            ? isProcessing
              ? "삭제 중..."
              : "투표 삭제"
            : isProcessing
              ? isOpenButton
                ? "시작 중..."
                : "종료 중..."
              : isOpenButton
                ? "투표 시작"
                : isCloseButton
                  ? "투표 종료"
                  : "투표 종료됨"}
        </button>
      </div>
    </div>
  );
};

const NotCreatedView = ({
  projects,
  selectedProjects,
  toggleProjectSelect,
}) => {
  return (
    <>
      <div className={styles.upperRight}>
        투표에 참여할 프로젝트를 선택해주세요. ({selectedProjects.length}/
        {projects.length}개 선택)
      </div>
      <div className={styles.cardGrid}>
        {projects.length === 0 && (
          <p className={styles.emptyState}>등록된 프로젝트가 없습니다.</p>
        )}
        {projects.map((p) => (
          <button
            type="button"
            aria-pressed={selectedProjects.includes(p.projectId)}
            key={p.projectId}
            className={`${styles.card} ${!selectedProjects.includes(p.projectId) ? styles.deselected : ""}`}
            onClick={() => toggleProjectSelect(p.projectId)}
          >
            <img src={p.thumbnail} className={styles.thumbnail} alt="" />
            <span className={styles.title}>{p.title}</span>
            <span className={styles.selection}>
              {selectedProjects.includes(p.projectId) ? "선택됨" : "선택 안 됨"}
            </span>
          </button>
        ))}
      </div>
    </>
  );
};

const ResultsView = ({
  semester,
  isVoting,
  isResultPublic,
  isProcessing,
  handleSetPublicStatus,
}) => {
  const [voteResult, setVoteResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    let timer;
    const refresh = async () => {
      setLoading(true);
      try {
        const results = await adminVoteApi.getResults(semester);
        if (!active) return;
        setVoteResult(results);
        setUpdatedAt(new Date());
        setError("");
      } catch {
        if (active)
          setError("투표 현황을 불러오지 못했습니다. 다시 시도해주세요.");
      } finally {
        if (active) {
          setLoading(false);
          if (isVoting) timer = setTimeout(refresh, 30000);
        }
      }
    };
    refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [semester, isVoting, revision]);

  const publicBtnClass = isResultPublic
    ? styles.publicBtnActive
    : styles.publicBtn;
  const privateBtnClass = isResultPublic
    ? styles.publicBtn
    : styles.publicBtnActive;
  const sortedResults = [...(voteResult || [])].sort(
    (a, b) => b.voteCount - a.voteCount || a.projectId - b.projectId,
  );

  return (
    <div>
      <div className={styles.resultTitle}>
        {isVoting ? "현재 투표 현황" : "투표 결과"}
      </div>

      <div className={styles.resultBody}>
        <div className={styles.upperLeft}>
          <div aria-live="polite">
            {voteResult !== null && (
              <p>
                총{" "}
                {voteResult.reduce((sum, result) => sum + result.voteCount, 0)}
                표 · 참여 프로젝트 {voteResult.length}개
              </p>
            )}
            {updatedAt && (
              <p>마지막 갱신: {updatedAt.toLocaleTimeString("ko-KR")}</p>
            )}
            {isVoting && (
              <p>30초마다 자동 갱신됩니다. 득표율은 전체 투표수 기준입니다.</p>
            )}
          </div>
          <button
            className={styles.publicBtn}
            disabled={loading}
            onClick={() => setRevision((value) => value + 1)}
          >
            {loading ? "현황 불러오는 중..." : "현황 새로고침"}
          </button>
        </div>
        {error && (
          <p role="alert">
            {error}
            {voteResult !== null && " 마지막으로 조회한 현황을 표시합니다."}
          </p>
        )}
        {voteResult !== null && (
          <div
            className={styles.tableWrapper}
            tabIndex={0}
            role="region"
            aria-label="투표 결과 표"
          >
            <table>
              <thead>
                <tr>
                  <th>등수</th>
                  <th>프로젝트명</th>
                  <th>득표수</th>
                  <th>득표율</th>
                </tr>
              </thead>
              <tbody>
                {voteResult.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      투표결과가 없습니다
                    </td>
                  </tr>
                ) : (
                  sortedResults.map((result) => (
                    <tr key={result.projectId}>
                      <td>
                        {sortedResults.findIndex(
                          (item) => item.voteCount === result.voteCount,
                        ) + 1}
                      </td>
                      <td>{result.projectName}</td>
                      <td>{result.voteCount}</td>
                      <td>{result.voteRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.publicBtns}>
          <button
            className={publicBtnClass}
            onClick={() => handleSetPublicStatus(true)}
            aria-pressed={isResultPublic}
            disabled={isVoting || isProcessing || isResultPublic}
          >
            공개
          </button>
          <button
            className={privateBtnClass}
            onClick={() => handleSetPublicStatus(false)}
            aria-pressed={!isResultPublic}
            disabled={isVoting || isProcessing || !isResultPublic}
          >
            비공개
          </button>
        </div>
      </div>
    </div>
  );
};

const ManageVotePage = () => {
  const [voteStatus, setVoteStatus] = useState(""); // 투표 상태 (NOT_CREATED, VOTING, ENDED)
  const [semester, setSemester] = useState(null); // 현재 학기
  const [isProcessing, setIsProcessing] = useState(false); // 열기,닫기 버튼 누를 때 로딩 상태

  const [isLoading, setIsLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(""); // 에러 상태

  const [isResultPublic, setIsResultPublic] = useState(false); // 투표 결과 공개 여부
  const [projects, setProjects] = useState([]); // 프로젝트 목록 상태
  const [selectedProjects, setSelectedProjects] = useState([]); // 선택된 프로젝트 ID 목록
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달창 열림 여부

  useEffect(() => {
    setSemester(getCurrentSemester());
  }, []);

  // 투표 상태 조회
  useEffect(() => {
    if (!semester) return;

    const fetchVoteStart = async () => {
      try {
        const data = await adminVoteApi.getStatus(semester);
        setVoteStatus(data.status);
      } catch (e) {
        setError("투표 상태 조회 실패");
      } finally {
        setIsLoading(false);
      }
    };
    fetchVoteStart();
  }, [semester]);

  // 프로젝트 목록 불러오기
  useEffect(() => {
    if (voteStatus !== "NOT_CREATED" || !semester) return; // 투표가 열려있을때만 호출하기

    const fetchProjects = async () => {
      try {
        const data = await projectApi.getProjectList(semester);
        setProjects(data.projectsResponse || []);
      } catch (e) {
        setError("프로젝트 목록 조회 실패");
      }
    };
    fetchProjects();
  }, [voteStatus, semester]);

  // 프젝목록을 모두 저장
  useEffect(() => {
    if (projects && projects.length > 0) {
      setSelectedProjects(projects.map((p) => p.projectId));
    }
  }, [projects]);

  // 투표 열기 핸들러
  const handleOpenVote = async () => {
    if (voteStatus !== "NOT_CREATED") return;

    try {
      setIsProcessing(true);
      await adminVoteApi.open(semester, selectedProjects);
      setVoteStatus("VOTING");
      setIsModalOpen(false);
    } catch (e) {
      alert("투표 열기에 실패했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  // 투표 삭제 핸들러
  const handleDeleteVote = async () => {
    if (voteStatus !== "ENDED" || isProcessing) return;
    if (
      !window.confirm(
        "해당 학기의 투표 정보와 모든 투표 기록 및 결과를 완전히 삭제합니다. 복구할 수 없습니다. 프로젝트 원본은 유지됩니다. 삭제하시겠습니까?",
      )
    )
      return;

    try {
      setIsProcessing(true);
      await adminVoteApi.delete(semester);
      setVoteStatus("NOT_CREATED");
      setProjects([]);
      setSelectedProjects([]);
      setIsModalOpen(false);
      setIsResultPublic(false);
    } catch (e) {
      alert("투표 삭제에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 투표 닫기 핸들러
  const handleCloseVote = async () => {
    if (voteStatus !== "VOTING") return;

    try {
      setIsProcessing(true);

      // 투표 종료 요청
      await adminVoteApi.close(semester);

      // 투표 종료 후, 결과를 비공개 상태로 설정
      await adminVoteApi.setPublicStatus(semester, false);

      // 로컬 상태 업데이트
      setVoteStatus("ENDED");
      setIsResultPublic(false);
    } catch (e) {
      setError("투표 종료에 실패했습니다. ");
    } finally {
      setIsProcessing(false);
    }
  };

  // 프로젝트 선택 토글 로직
  const toggleProjectSelect = (id) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  // 투표할 프로젝트 제출 핸들러
  const handleSummitProjects = () => {
    if (selectedProjects.length === 0) {
      alert("최소 한 개 이상의 프로젝트를 선택해야 합니다.");
      return;
    }
    setIsModalOpen(true);
  };

  // 삭제 이후 늦게 도착한 공개 여부 응답은 폐기한다.
  useEffect(() => {
    if (voteStatus !== "ENDED" || !semester) return;
    let active = true;
    adminVoteApi.getIsVoteOpen(semester)
      .then((data) => {
        if (active) setIsResultPublic(data.isPublic || false);
      })
      .catch(() => {
        if (active) setError("투표 공개 상태 조회 실패");
      });
    return () => { active = false; };
  }, [voteStatus, semester]);

  // 투표 결과 공개 여부 핸들러
  const handleSetPublicStatus = async (isPublic) => {
    if (voteStatus !== "ENDED" || isProcessing) return;
    try {
      setIsProcessing(true);
      await adminVoteApi.setPublicStatus(semester, isPublic);

      // 서버 요청 성공 후 로컬 상태 업데이
      setIsResultPublic(isPublic);
    } catch {
      setError("투표 공개 상태 변경 실패");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading)
    return (
      <div className={styles.emptyState} role="status">
        투표 정보를 불러오는 중입니다.
      </div>
    );
  if (error)
    return (
      <div className={styles.emptyState} role="alert">
        {error}
      </div>
    );

  return (
    <div className={styles.container}>
      <HeaderSection
        semester={semester}
        isProcessing={isProcessing}
        voteStatus={voteStatus}
        onClick={
          voteStatus === "NOT_CREATED"
            ? handleSummitProjects // OPEN 누르면 모달
            : voteStatus === "ENDED"
              ? handleDeleteVote
              : handleCloseVote // CLOSE
        }
      />

      <div className={styles.bar}></div>

      {voteStatus === "NOT_CREATED" && (
        <NotCreatedView
          projects={projects}
          selectedProjects={selectedProjects}
          toggleProjectSelect={toggleProjectSelect}
        />
      )}

      {(voteStatus === "VOTING" || voteStatus === "ENDED") && (
        <ResultsView
          key={`${semester}-${voteStatus}`}
          semester={semester}
          isVoting={voteStatus === "VOTING"}
          isResultPublic={isResultPublic}
          isProcessing={isProcessing}
          handleSetPublicStatus={handleSetPublicStatus}
        />
      )}

      {isModalOpen && (
        <SubmitModal
          selectedProjects={selectedProjects}
          projects={projects}
          onConfirm={handleOpenVote}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ManageVotePage;
