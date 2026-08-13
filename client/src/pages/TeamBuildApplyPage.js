import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { teamBuildApi } from "../api/team-build";
import LoadingPage from "../components/LoadingPage";
import wapsLogo from "../assets/img/waps_logo.png";
import styles from "../assets/TeamBuildApply.module.css";
import noticeIcon from "../assets/img/noticeIcon.svg";
import noticeArrow from "../assets/img/noticeArrow.svg";
import emptyFolder from "../assets/img/emptyFolder.png";

const MAX_SELECTION = 5;
const POSITION_OPTIONS = [
  { value: "FRONTEND", label: "프론트엔드" },
  { value: "BACKEND", label: "백엔드" },
  { value: "AI", label: "AI" },
  { value: "DESIGN", label: "디자이너" },
  { value: "APP", label: "앱" },
  { value: "GAME", label: "게임" },
  { value: "EMBEDDED", label: "임베디드" },
];

const POSITION_LABELS = POSITION_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const PROJECT_TYPE_OPTIONS = [
  { value: "WEB", label: "웹" },
  { value: "APP", label: "앱" },
  { value: "GAME", label: "게임" },
  { value: "EMBEDDED", label: "임베디드" },
];

const readProjectType = (project) => project?.projectType || "";

const normalizeProjectType = (projectType) => {
  const raw = String(projectType || "").trim();
  const lower = raw.toLowerCase();

  if (lower === "web") return "WEB";
  if (lower === "app") return "APP";
  if (lower === "game") return "GAME";
  if (lower === "embedded" || lower === "etc" || lower === "기타") return "EMBEDDED";
  return raw.toUpperCase();
};

const getProjectTypeLabel = (projectType) => {
  const normalized = normalizeProjectType(projectType);
  const matched = PROJECT_TYPE_OPTIONS.find((option) => option.value === normalized);
  if (matched) return matched.label;
  return projectType || "기타";
};

const getProjectTypeStyleKey = (projectType) => {
  const normalized = normalizeProjectType(projectType);
  return PROJECT_TYPE_OPTIONS.some((option) => option.value === normalized) ? normalized : "EMBEDDED";
};

const formatApiError = (err, fallback) => {
  if (typeof err === "string") return err;
  if (err?.response?.data) {
    const data = err.response.data;
    if (typeof data === "string") return data;
    return data.message || data.error || fallback;
  }
  return err?.message || fallback;
};

const reorderProjectIds = (projectIds, movingId, targetId, placement = "before") => {
  const next = [...projectIds];
  const fromIndex = next.indexOf(movingId);
  const targetIndex = next.indexOf(targetId);
  if (fromIndex === -1 || targetIndex === -1) return projectIds;
  if (fromIndex === targetIndex) return projectIds;

  next.splice(fromIndex, 1);

  let insertIndex = targetIndex;
  if (fromIndex < targetIndex) {
    insertIndex -= 1;
  }
  if (placement === "after") {
    insertIndex += 1;
  }

  next.splice(insertIndex, 0, movingId);
  return next;
};

const calculateDropInsertIndex = (projectIds, movingId, targetId, placement = "before") => {
  if (!movingId || !targetId) return null;
  const withoutMoving = projectIds.filter((id) => id !== movingId);
  const targetIndex = withoutMoving.indexOf(targetId);
  if (targetIndex === -1) return null;
  return placement === "after" ? targetIndex + 1 : targetIndex;
};

function TeamBuildApplyPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [projects, setProjects] = useState([]);
  const [commonApplication, setCommonApplication] = useState(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState([]);
  const [activeStep, setActiveStep] = useState(1);
  const [formPosition, setFormPosition] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [messageLimitReached, setMessageLimitReached] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverPlacement, setDragOverPlacement] = useState("before");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [projectApplications, setProjectApplications] = useState([]);
  const [applicationModal, setApplicationModal] = useState(null);
  const [projectFormPosition, setProjectFormPosition] = useState("");
  const [projectFormMessage, setProjectFormMessage] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [applicationDraggingId, setApplicationDraggingId] = useState(null);
  const [applicationDragOverId, setApplicationDragOverId] = useState(null);
  const [applicationDragOverPlacement, setApplicationDragOverPlacement] = useState("before");
  //추가한 내용

  // useEffect(() => {
  //   const token = Cookies.get("authToken") || window.localStorage.getItem("authToken") || "";
  //   if (!token) {
  //     alert("로그인이 필요합니다.");
  //     navigate("/login");
  //   }
  // }, [navigate]);

  // useEffect(() => {
  //   let active = true;

  //   const fetchData = async () => {
  //     const token = Cookies.get("authToken") || window.localStorage.getItem("authToken") || "";
  //     if (!token) {
  //       setIsLoading(false);
  //       return;
  //     }
  //     setIsLoading(true);
  //     setLoadError("");
  //     try {
  //       const status = await teamBuildApi.getApplyStatus();
  //       if (!active) return;
  //       const applied = Boolean(status?.hasApplied);
  //       setHasApplied(applied);

  //       if (!applied) {
  //         const projectList = await teamBuildApi.getApplyProjects();
  //         if (!active) return;
  //         setProjects(Array.isArray(projectList) ? projectList : []);
  //       }
  //     } catch (err) {
  //       if (!active) return;
  //       setLoadError(formatApiError(err, "프로젝트 목록을 불러오지 못했습니다."));
  //     } finally {
  //       if (active) setIsLoading(false);
  //     }
  //   };

  //   fetchData();
  //   return () => {
  //     active = false;
  //   };
  // }, []);

  useEffect(() => {
  setHasApplied(false);

  setProjects([
      {
        projectId: 1,
        title: "프로젝트 1",
        projectType: "WEB",
        summary: "사용자 경험을 혁신하는 웹 플랫폼 개발 프로젝트입니다.",
        techStack: ["React", "JavaScript"],
        recruitPositions: ["FRONTEND", "BACKEND", "DESIGN"],
      },
      {
        projectId: 2,
        title: "프로젝트 2",
        projectType: "APP",
        summary: "데이터 기반 서비스를 구축하는 프로젝트입니다.",
        techStack: ["React Native", "Spring"],
        recruitPositions: ["APP", "BACKEND", "DESIGN"],
      },
      {
        projectId: 3,
        title: "프로젝트 3",
        projectType: "GAME",
        summary: "새로운 게임 서비스를 개발하는 프로젝트입니다.",
        techStack: ["Unity", "C#"],
        recruitPositions: ["GAME", "BACKEND", "DESIGN"],
      },
    ]);

    setIsLoading(false);
  }, []);
  // 나중에 제거하기. 임시 내용

  const projectsById = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => map.set(project.projectId, project));
    return map;
  }, [projects]);

  const selectedProjects = useMemo(() => {
    return selectedProjectIds
      .map((id) => projectsById.get(id))
      .filter(Boolean);
  }, [selectedProjectIds, projectsById]);

  const dropInsertIndex = useMemo(() => {
    return calculateDropInsertIndex(selectedProjectIds, draggingId, dragOverId, dragOverPlacement);
  }, [selectedProjectIds, draggingId, dragOverId, dragOverPlacement]);

  const priorityPreviewProjects = useMemo(() => {
    if (!draggingId || !dragOverId || dropInsertIndex === null) return selectedProjects;

    const previewProjectIds = reorderProjectIds(
      selectedProjectIds,
      draggingId,
      dragOverId,
      dragOverPlacement
    );
    return previewProjectIds
      .map((id) => projectsById.get(id))
      .filter(Boolean);
  }, [
    selectedProjects,
    selectedProjectIds,
    draggingId,
    dragOverId,
    dragOverPlacement,
    dropInsertIndex,
    projectsById,
  ]);

  const filteredProjects = useMemo(() => {
    if (selectedProjectTypes.length === 0) return projects;
    const selectedTypeSet = new Set(selectedProjectTypes);
    return projects.filter((project) => selectedTypeSet.has(normalizeProjectType(readProjectType(project))));
  }, [projects, selectedProjectTypes]);

  const canSelectProjects = Boolean(commonApplication);
  const selectedCount = selectedProjectIds.length;
  const canReviewPriority = canSelectProjects && selectedCount > 0;
  const isAllProjectTypes = selectedProjectTypes.length === 0;

  const getPositionLabel = (value) => POSITION_LABELS[value] || value;

  const openProjectApplication = (project, application = null) => {
    if (!application && projectApplications.length >= MAX_SELECTION) {
      alert(`지원서는 최대 ${MAX_SELECTION}개까지 작성할 수 있습니다.`);
      return;
    }
    setApplicationModal({ project, application });
    setProjectFormPosition(application?.position || "");
    setProjectFormMessage(application?.message || "");
  };

  const closeProjectApplication = () => {
    setApplicationModal(null);
    setProjectFormPosition("");
    setProjectFormMessage("");
  };

  const saveProjectApplication = () => {
    if (!projectFormPosition) {
      alert("지원 직무를 선택해주세요.");
      return;
    }
    if (!projectFormMessage.trim()) {
      alert("자기소개 및 PR 메시지를 작성해주세요.");
      return;
    }

    const { project, application } = applicationModal;
    const isDuplicate = projectApplications.some(
      (item) => item.projectId === project.projectId &&
        item.position === projectFormPosition && item.id !== application?.id
    );
    if (isDuplicate) {
      alert("이미 이 프로젝트의 같은 직무에 지원했습니다.");
      return;
    }

    if (application) {
      setProjectApplications((prev) => prev.map((item) =>
        item.id === application.id
          ? { ...item, position: projectFormPosition, message: projectFormMessage.trim() }
          : item
      ));
    } else {
      setProjectApplications((prev) => [...prev, {
        id: `${project.projectId}-${Date.now()}`,
        projectId: project.projectId,
        projectTitle: project.title,
        position: projectFormPosition,
        message: projectFormMessage.trim(),
      }]);
    }
    closeProjectApplication();
  };

  const cancelProjectApplication = () => {
    if (!cancelTarget) return;
    setProjectApplications((prev) => prev.filter((item) => item.id !== cancelTarget.id));
    setCancelTarget(null);
  };

  const handleApplicationDragStart = (applicationId) => (event) => {
    setApplicationDraggingId(applicationId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(applicationId));
  };

  const handleApplicationDragOver = (applicationId) => (event) => {
    if (!applicationDraggingId || applicationDraggingId === applicationId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    setApplicationDragOverPlacement(
      event.clientY - rect.top > rect.height / 2 ? "after" : "before"
    );
    setApplicationDragOverId(applicationId);
  };

  const handleApplicationDrop = (targetId) => (event) => {
    event.preventDefault();
    if (!applicationDraggingId || applicationDraggingId === targetId) return;

    setProjectApplications((prev) => {
      const applicationById = new Map(prev.map((application) => [application.id, application]));
      return reorderProjectIds(
        prev.map((application) => application.id),
        applicationDraggingId,
        targetId,
        applicationDragOverPlacement
      ).map((id) => applicationById.get(id));
    });
    setApplicationDragOverId(null);
    setApplicationDragOverPlacement("before");
  };

  const handleApplicationDragEnd = () => {
    setApplicationDraggingId(null);
    setApplicationDragOverId(null);
    setApplicationDragOverPlacement("before");
  };

  const submitProjectApplications = async () => {
    if (projectApplications.length < 3) return;

    const confirmMessage =
      `다음 우선순위로 ${projectApplications.length}개의 지원서를 최종 제출하시겠습니까?\n\n` +
      projectApplications
        .map(
          (application, index) =>
            `${index + 1}순위: ${application.projectTitle} (${getPositionLabel(application.position)})`
        )
        .join("\n");

    if (!window.confirm(confirmMessage)) return;

    const applies = projectApplications.map((application) => ({
      projectId: application.projectId,
      position: application.position,
      comment: application.message,
    }));

    setIsSubmitting(true);
    try {
      await teamBuildApi.submitApply({ applies });
      alert("지원서가 우선순위대로 최종 제출되었습니다.");
      setHasApplied(true);
      navigate(-1);
    } catch (err) {
      alert(formatApiError(err, "지원서 제출 중 오류가 발생했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewText = (text, maxLength = 120) => {
    if (!text) return "";
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const toggleProjectTypeFilter = (type) => {
    setSelectedProjectTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const openStep = (step) => {
    if (step !== 3) {
      setDraggingId(null);
      setDragOverId(null);
      setDragOverPlacement("before");
    }
    if (step === 1) {
      setActiveStep(1);
      return;
    }
    if (step === 2) {
      if (!canSelectProjects) {
        alert("먼저 지원서를 작성해주세요.");
        return;
      }
      setActiveStep(2);
      return;
    }
    if (!canReviewPriority) {
      alert("먼저 프로젝트를 선택해주세요.");
      return;
    }
    setActiveStep(3);
  };

  const handleMessageChange = (event) => {
    let value = event.target.value;
    if (value.length > 255) {
      value = value.slice(0, 255);
    }
    setFormMessage(value);
    setMessageLimitReached(value.length >= 255);
  };

  const saveCommonApplication = () => {
    if (!formPosition) {
      alert("지원 직무를 선택해주세요.");
      return;
    }
    if (!formMessage || formMessage.trim() === "") {
      alert("자기소개 및 PR 메시지를 작성해주세요.");
      return;
    }

    setCommonApplication({
      position: formPosition,
      message: formMessage.trim(),
    });
    setActiveStep(selectedProjectIds.length > 0 ? 3 : 2);
  };

  const addToCart = (projectId) => {
    if (!commonApplication) {
      alert("먼저 지원서를 작성해주세요.");
      return;
    }

    if (selectedProjectIds.includes(projectId)) {
      alert("이미 선택된 프로젝트입니다.");
      return;
    }

    if (selectedProjectIds.length >= MAX_SELECTION) {
      alert(`프로젝트는 최대 ${MAX_SELECTION}개까지만 선택할 수 있습니다.`);
      return;
    }

    setSelectedProjectIds((prev) => [...prev, projectId]);
  };

  const removeFromCart = (projectId) => {
    setSelectedProjectIds((prev) => prev.filter((id) => id !== projectId));
  };

  const clearCart = () => {
    if (window.confirm("선택된 모든 프로젝트를 삭제하시겠습니까?")) {
      setSelectedProjectIds([]);
    }
  };

  const handleDragStart = (projectId) => (event) => {
    setDraggingId(projectId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(projectId));
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
    setDragOverPlacement("before");
  };

  const handleDragOver = (projectId) => (event) => {
    if (!draggingId || draggingId === projectId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    const isAfter = event.clientY - rect.top > rect.height / 2;
    setDragOverPlacement(isAfter ? "after" : "before");
    setDragOverId(projectId);
  };

  const finalizeReorder = (targetProjectId) => {
    if (!draggingId) return;
    const targetId =
      targetProjectId && targetProjectId !== draggingId ? targetProjectId : dragOverId;

    if (!targetId || targetId === draggingId) return;
    setSelectedProjectIds((prev) =>
      reorderProjectIds(prev, draggingId, targetId, dragOverPlacement)
    );
  };

  const handleListDragOver = (event) => {
    if (!draggingId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleListDrop = (event) => {
    event.preventDefault();
    finalizeReorder();
    setDragOverId(null);
    setDragOverPlacement("before");
  };

  const handleDrop = (projectId) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    finalizeReorder(projectId);
    setDragOverId(null);
    setDragOverPlacement("before");
  };

  useEffect(() => {
    if (!commonApplication && activeStep !== 1) {
      setActiveStep(1);
      return;
    }
    if (commonApplication && selectedCount === 0 && activeStep === 3) {
      setActiveStep(2);
    }
  }, [activeStep, commonApplication, selectedCount]);

  const submitAllApplications = async () => {
    if (selectedProjectIds.length === 0) {
      alert("제출할 프로젝트가 없습니다.");
      return;
    }
    if (selectedProjectIds.length > MAX_SELECTION) {
      alert(`프로젝트는 최대 ${MAX_SELECTION}개까지만 지원할 수 있습니다.`);
      return;
    }
    if (!commonApplication) {
      alert("지원서가 작성되지 않았습니다.");
      return;
    }

    const projectTitles = selectedProjectIds.map((id) => {
      const project = projectsById.get(id);
      return project ? project.title : `프로젝트 ${id}`;
    });

    const confirmMessage =
      `다음 순서로 ${selectedProjectIds.length}개 프로젝트에 지원하시겠습니까?\n\n` +
      `지원 직무: ${getPositionLabel(commonApplication.position)}\n\n` +
      projectTitles.map((title, index) => `${index + 1}순위: ${title}`).join("\n");

    if (!window.confirm(confirmMessage)) return;

    const applies = selectedProjectIds.map((projectId) => ({
      projectId,
      position: commonApplication.position,
      comment: commonApplication.message,
    }));

    setIsSubmitting(true);
    try {
      await teamBuildApi.submitApply({ applies });
      alert(`${selectedProjectIds.length}개 프로젝트에 우선순위대로 지원이 완료되었습니다!`);
      setHasApplied(true);
      setSelectedProjectIds([]);
      navigate(-1);
    } catch (err) {
      alert(formatApiError(err, "지원 중 오류가 발생했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!commonApplication) return;
    setFormPosition(commonApplication.position || "");
    setFormMessage(commonApplication.message || "");
    setMessageLimitReached(Boolean(commonApplication.message?.length >= 255));
  }, [commonApplication]);

  const step1Expanded = activeStep === 1;
  const step2Expanded = activeStep === 2;
  const step3Expanded = activeStep === 3;
  const step1Status = !canSelectProjects ? "진행 중" : step1Expanded ? "수정 중" : "완료";
  const step2Status = !canSelectProjects ? "잠김" : step2Expanded ? "진행 중" : canReviewPriority ? "완료" : "대기 중";
  const step3Status = !canReviewPriority ? "잠김" : step3Expanded ? "진행 중" : "대기 중";
  const summaryPreviewProjects = selectedProjects.slice(0, 3);
  const hiddenProjectCount = selectedCount - summaryPreviewProjects.length;
  const selectedProjectTypeLabels = selectedProjectTypes.map(
    (type) => PROJECT_TYPE_OPTIONS.find((option) => option.value === type)?.label || type
  );

  if (isLoading) {
    return <LoadingPage />;
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.errorCard}>
            <div className={styles.errorTitle}>불러오기 실패</div>
            <div className={styles.errorMessage}>{loadError}</div>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => window.location.reload()}
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasApplied) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.appliedCard}>
            <h1>이미 지원하셨습니다</h1>
            <p>이번 학기에는 추가 지원이 불가합니다.</p>
            <button type="button" className={styles.primaryButton} onClick={() => navigate(-1)}>
              뒤로가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <div className={styles.brand}>
            <img src={wapsLogo} alt="WAPs" className={styles.brandLogo} />
            <span className={styles.brandText}>WAPs</span>
          </div>
          <button type="button" className={styles.closeButton} onClick={() => navigate(-1)}>
            ×
          </button>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroTitle}>TEAM BUILDING</div>
          <div className={styles.heroSubtitle}>
            함께할 팀을 찾고, 원하는 프로젝트에 도전해보세요
          </div>
        </div>

        <div className={styles.notice}>
          <button
            type="button"
            className={styles.noticeButton}
            onClick={() => setIsNoticeOpen(!isNoticeOpen)}
          >
            <div className={styles.noticeTitle}>
              <img
                src={noticeIcon}
                alt=""
                className={styles.noticeIcon}
              />
              <span>팀빌딩 안내사항</span>
            </div>

            <span
              className={`${styles.noticeArrow} ${
                isNoticeOpen ? styles.noticeArrowOpen : ""
              }`}
            >
              <img src={noticeArrow} alt="" aria-hidden="true" />
            </span>
          </button>

          {isNoticeOpen && (
            <div className={styles.noticeContent}>
              <p>• 이번 팀빌딩은 총 3차에 걸쳐 진행됩니다.</p>
              <p>• 지원서는 최소 3개 - 최대 5개까지 지원할 수 있으며, 동일 프로젝트에도 서로 다른 직무로 지원할 수 있습니다.</p>
            </div>
          )}
        </div>

        <section className={styles.myApply}>
          <div className={styles.myApplyHeader}>
            <div className={styles.myApplyTitle}>
              <div className={styles.myApplyTitleRow}>
                <h2>내 지원서</h2>
                <div className={styles.myApplyCount}>
                  <span className={styles.currentCount}>{projectApplications.length}</span>
                  <span>/</span>
                  <span>5</span>
                </div>
              </div>
              <p>지원한 프로젝트를 한눈에 확인하고, 우선순위를 조정하세요</p>
              <p>(우선순위는 드래그로 조정이 가능합니다)</p>
            </div>
          </div>

          {projectApplications.length === 0 ? (
            <div className={styles.emptyApply}>
              <img src={emptyFolder} alt="" className={styles.emptyFolder} />
              <p>아직 지원한 프로젝트가 없습니다</p>
            </div>
          ) : (
            <>
              <div className={styles.myApplicationList}>
                {projectApplications.map((application, index) => {
                const isDropTarget =
                  applicationDragOverId === application.id &&
                  applicationDraggingId !== application.id;
                const dropPlacementClass = isDropTarget
                  ? applicationDragOverPlacement === "after"
                    ? styles.dropAfter
                    : styles.dropBefore
                  : "";

                return (
                <div
                  key={application.id}
                  className={`${styles.myApplicationItem} ${
                    applicationDraggingId === application.id ? styles.dragging : ""
                  } ${isDropTarget ? styles.dragOver : ""} ${dropPlacementClass}`}
                  draggable
                  onDragStart={handleApplicationDragStart(application.id)}
                  onDragEnd={handleApplicationDragEnd}
                  onDragOver={handleApplicationDragOver(application.id)}
                  onDrop={handleApplicationDrop(application.id)}
                >
                  <div className={`${styles.priorityNumber} ${styles.myApplicationPriorityNumber}`}>
                    {index + 1}
                  </div>
                  <div className={styles.myApplicationName}>
                    <span>{application.projectTitle}</span>
                    <span>·</span>
                    <strong>{getPositionLabel(application.position)}</strong>
                  </div>
                  <span className={styles.dragHandle}>⋮⋮</span>
                  <button
                    type="button"
                    className={styles.cancelApplicationButton}
                    onClick={() => setCancelTarget(application)}
                  >
                    지원 취소
                  </button>
                </div>
                );
                })}
              </div>
              {projectApplications.length >= 3 && (
                <button
                  type="button"
                  className={`${styles.modifyApplicationButton} ${styles.finalSubmitButton}`}
                  onClick={submitProjectApplications}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "제출 중..." : "최종 제출하기"}
                </button>
              )}
            </>
          )}
        </section>

        <section className={styles.availableSection}>
          <div className={styles.availableHeader}>
            <div>
              <h2>지원가능한 프로젝트</h2>
              <p></p>
            </div>
          </div>

          <div className={styles.availableProjectList}>
            {projects.map((project) => {
              const applications = projectApplications.filter(
                (item) => item.projectId === project.projectId
              );
              return (
                <article
                  key={project.projectId}
                  className={styles.applicationProjectCard}
                >
                  <div className={styles.applicationProjectTop}>
                    <div>
                      <h3>{project.title}</h3>
                      <p>{project.summary}</p>
                    </div>
                    {applications.length > 0 && <span className={styles.appliedMark}></span>}
                  </div>
                  <div className={styles.recruitBlock}>
                    <div className={styles.recruitPositions}>
                      {project.recruitPositions.map((position) => (
                        <span
                          key={position}
                          className={`${styles.recruitPosition} ${
                            applications.some((item) => item.position === position)
                              ? styles.recruitPositionApplied : ""
                          }`}
                        >
                          {getPositionLabel(position)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.applicationActions}>
                    {applications.map((application) => (
                      <button
                        key={application.id}
                        type="button"
                        className={styles.modifyApplicationButton}
                        onClick={() => openProjectApplication(project, application)}
                      >
                        지원서 수정하기 ({getPositionLabel(application.position)})
                      </button>
                    ))}
                    <button
                      type="button"
                      className={applications.length
                        ? styles.addApplicationButton : styles.writeApplicationButton}
                      onClick={() => openProjectApplication(project)}
                      disabled={projectApplications.length >= MAX_SELECTION}
                    >
                      {applications.length ? "+ 지원서 추가 작성하기" : "지원서 작성하기"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className={styles.existingFormLabel}>기존 지원서 작성 박스</div>

        <section className={styles.stepStack} aria-label="지원 단계">
          <section
            className={`${styles.panel} ${styles.editablePanel} ${
              step1Expanded ? styles.editablePanelActive : ""
            }`}
          >
            <div className={styles.editableHeader}>
              <div className={styles.editableTitleWrap}>
                <div className={styles.panelTitle}>
                  <span className={styles.panelStep}>1</span>
                  지원서 작성
                </div>
                <span className={`${styles.stepChip} ${canSelectProjects ? styles.stepChipDone : styles.stepChipCurrent}`}>
                  {step1Status}
                </span>
              </div>
              {!step1Expanded && canSelectProjects && (
                <button type="button" className={styles.editButton} onClick={() => openStep(1)}>
                  수정
                </button>
              )}
            </div>

            {!step1Expanded ? (
              <div className={styles.sectionSummary}>
                <div className={styles.summaryRow}>
                  <span>지원 직무</span>
                  <strong>{getPositionLabel(commonApplication?.position)}</strong>
                </div>
                <div className={styles.summaryText}>{getPreviewText(commonApplication?.message, 150)}</div>
              </div>
            ) : (
              <div className={styles.sectionBody}>
                <div className={styles.formGroup}>
                  <label htmlFor="commonPosition">지원 직무</label>
                  <select
                    id="commonPosition"
                    value={formPosition}
                    onChange={(event) => setFormPosition(event.target.value)}
                  >
                    <option value="">직무를 선택해주세요</option>
                    {POSITION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="commonMessage">자기소개 및 PR 메시지</label>
                  <textarea
                    id="commonMessage"
                    value={formMessage}
                    onChange={handleMessageChange}
                    placeholder="자신의 경험, 기술 스택, 프로젝트에 기여할 수 있는 부분 등을 작성해주세요. 이 메시지는 선택한 모든 프로젝트에 동일하게 전송됩니다."
                    maxLength={255}
                    className={messageLimitReached ? styles.textareaError : ""}
                  />
                  {messageLimitReached && (
                    <div className={styles.messageError}>최대 255자까지만 작성할 수 있습니다.</div>
                  )}
                </div>

                <button type="button" className={styles.modalSubmit} onClick={saveCommonApplication}>
                  지원서 저장하고 다음으로
                </button>
              </div>
            )}
          </section>

          <section
            className={`${styles.panel} ${styles.editablePanel} ${
              step2Expanded ? styles.editablePanelActive : ""
            } ${!canSelectProjects ? styles.panelLocked : ""}`}
          >
            <div className={styles.editableHeader}>
              <div className={styles.editableTitleWrap}>
                <div className={styles.panelTitle}>
                  <span className={styles.panelStep}>2</span>
                  프로젝트 선택
                  <span className={styles.badge}>{selectedCount}</span>
                </div>
                <span
                  className={`${styles.stepChip} ${
                    !canSelectProjects
                      ? styles.stepChipLocked
                      : canReviewPriority
                      ? styles.stepChipDone
                      : styles.stepChipCurrent
                  }`}
                >
                  {step2Status}
                </span>
              </div>
              {step2Expanded && selectedCount > 0 ? (
                <button type="button" className={styles.clearButton} onClick={clearCart}>
                  전체 삭제
                </button>
              ) : (
                !step2Expanded &&
                canSelectProjects && (
                  <button type="button" className={styles.editButton} onClick={() => openStep(2)}>
                    수정
                  </button>
                )
              )}
            </div>

            {!step2Expanded ? (
              <div className={styles.sectionSummary}>
                {!canSelectProjects ? (
                  <div className={styles.summaryText}>Step 1 완료 후 프로젝트를 선택할 수 있습니다.</div>
                ) : selectedCount === 0 ? (
                  <div className={styles.summaryText}>아직 선택된 프로젝트가 없습니다.</div>
                ) : (
                  <>
                    <div className={styles.summaryRow}>
                      <span>선택된 프로젝트</span>
                      <strong>{selectedCount}개</strong>
                    </div>
                    <div className={styles.summaryChips}>
                      {summaryPreviewProjects.map((project) => (
                        <span key={project.projectId} className={styles.summaryChip}>
                          {project.title}
                        </span>
                      ))}
                      {hiddenProjectCount > 0 && (
                        <span className={styles.summaryChip}>+{hiddenProjectCount}개</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className={styles.sectionBody}>
                {!canSelectProjects && (
                  <div className={styles.lockNotice}>
                    <span>1단계 지원서 작성 완료 후 프로젝트를 선택할 수 있습니다.</span>
                    <button type="button" className={styles.lockAction} onClick={() => openStep(1)}>
                      Step 1로 이동
                    </button>
                  </div>
                )}

                <div className={styles.cartBox}>
                  {selectedProjects.length === 0 ? (
                    <div className={styles.cartEmpty}>
                      {!canSelectProjects ? (
                        <>
                          아직 프로젝트를 선택할 수 없습니다.
                          <br />
                          위의 1단계를 먼저 진행해 주세요.
                        </>
                      ) : (
                        <>
                          아직 선택된 프로젝트가 없습니다.
                          <br />
                          프로젝트를 선택해 주세요.
                        </>
                      )}
                    </div>
                  ) : (
                    <div className={styles.cartItems}>
                      {selectedProjects.map((project) => (
                        <div key={project.projectId} className={styles.cartItem}>
                          <span>{project.title}</span>
                          <button
                            type="button"
                            className={styles.cartRemove}
                            onClick={() => removeFromCart(project.projectId)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.projectFilterRow}>
                  <div className={styles.projectFilterOptions}>
                    <button
                      type="button"
                      className={`${styles.projectTypeChip} ${styles.projectTypeChipAll} ${
                        isAllProjectTypes ? styles.projectTypeChipActive : ""
                      }`}
                      onClick={() => setSelectedProjectTypes([])}
                      aria-pressed={isAllProjectTypes}
                    >
                      모두
                    </button>
                    {PROJECT_TYPE_OPTIONS.map((option) => {
                      const isActive = selectedProjectTypes.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`${styles.projectTypeChip} ${
                            styles[`projectTypeChip${option.value}`]
                          } ${isActive ? styles.projectTypeChipActive : ""}`}
                          onClick={() => toggleProjectTypeFilter(option.value)}
                          aria-pressed={isActive}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.projectsSection} aria-label="프로젝트 선택 목록">
                  {projects.length === 0 ? (
                    <div className={styles.emptyProjects}>현재 지원 가능한 프로젝트가 없습니다.</div>
                  ) : filteredProjects.length === 0 ? (
                    <div className={styles.emptyProjects}>
                      선택한 종류
                      {!isAllProjectTypes && `(${selectedProjectTypeLabels.join(", ")})`}의 프로젝트가 없습니다.
                    </div>
                  ) : (
                    filteredProjects.map((project) => {
                      const isSelected = selectedProjectIds.includes(project.projectId);
                      return (
                        <div
                          key={project.projectId}
                          className={`${styles.projectCard} ${isSelected ? styles.projectSelected : ""} ${
                            !canSelectProjects ? styles.projectLocked : ""
                          }`}
                        >
                          <div className={styles.projectHeader}>
                            <div className={styles.projectTitle}>{project.title}</div>
                            {!canSelectProjects ? (
                              <div className={styles.projectStateMuted}>1단계 필요</div>
                            ) : (
                              isSelected && <div className={styles.projectCheck}>✓</div>
                            )}
                          </div>
                          <div className={styles.projectMetaRow}>
                            <span
                              className={`${styles.projectTypeTag} ${
                                styles[`projectTypeTag${getProjectTypeStyleKey(readProjectType(project))}`]
                              }`}
                            >
                              {getProjectTypeLabel(readProjectType(project))}
                            </span>
                          </div>
                          <div className={styles.projectSummary}>{project.summary}</div>
                          <div className={styles.techStack}>
                            {(project.techStack || []).map((tech) => (
                              <span key={tech} className={styles.techTag}>
                                {tech}
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            className={`${styles.projectButton} ${
                              isSelected ? styles.projectButtonSelected : ""
                            }`}
                            onClick={() =>
                              isSelected ? removeFromCart(project.projectId) : addToCart(project.projectId)
                            }
                            disabled={!canSelectProjects}
                          >
                            {!canSelectProjects
                              ? "1단계 지원서 작성 필요"
                              : isSelected
                              ? "선택됨"
                              : "프로젝트 선택"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  className={styles.applyButton}
                  onClick={() => openStep(3)}
                  disabled={!canReviewPriority || selectedCount > MAX_SELECTION}
                >
                  우선순위 설정으로 이동
                </button>
              </div>
            )}
          </section>

          <section
            className={`${styles.panel} ${styles.editablePanel} ${
              step3Expanded ? styles.editablePanelActive : ""
            } ${!canReviewPriority ? styles.panelLocked : ""}`}
          >
            <div className={styles.editableHeader}>
              <div className={styles.editableTitleWrap}>
                <div className={styles.panelTitle}>
                  <span className={styles.panelStep}>3</span>
                  우선순위 확인 및 제출
                </div>
                <span
                  className={`${styles.stepChip} ${
                    !canReviewPriority ? styles.stepChipLocked : styles.stepChipCurrent
                  }`}
                >
                  {step3Status}
                </span>
              </div>
              {!step3Expanded && canReviewPriority && (
                <button type="button" className={styles.editButton} onClick={() => openStep(3)}>
                  수정
                </button>
              )}
            </div>

            {!step3Expanded ? (
              <div className={styles.sectionSummary}>
                {!canReviewPriority ? (
                  <div className={styles.summaryText}>Step 2에서 프로젝트를 선택하면 제출 단계가 열립니다.</div>
                ) : (
                  <>
                    <div className={styles.summaryRow}>
                      <span>제출 예정 프로젝트</span>
                      <strong>{selectedCount}개</strong>
                    </div>
                    <div className={styles.summaryText}>
                      {summaryPreviewProjects.map((project, index) => `${index + 1}. ${project.title}`).join(" / ")}
                      {hiddenProjectCount > 0 ? ` / +${hiddenProjectCount}개` : ""}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className={styles.sectionBody}>
                {!canReviewPriority ? (
                  <div className={styles.lockNotice}>
                    <span>먼저 Step 2에서 최소 1개 이상의 프로젝트를 선택해주세요.</span>
                    <button type="button" className={styles.lockAction} onClick={() => openStep(2)}>
                      Step 2로 이동
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.priorityGuide}>
                      <strong>지원 우선순위 설정</strong>
                      <span>· 드래그하면 이동될 순서가 미리 반영됩니다.</span>
                    </div>

                    <ol
                      className={`${styles.priorityList} ${draggingId ? styles.priorityListDragging : ""}`}
                      onDragOver={handleListDragOver}
                      onDrop={handleListDrop}
                    >
                      {priorityPreviewProjects.map((project, index) => {
                        const isDropTarget =
                          Boolean(draggingId) &&
                          dragOverId === project.projectId &&
                          draggingId !== project.projectId;
                        const dropPlacementClass = isDropTarget
                          ? dragOverPlacement === "after"
                            ? styles.dropAfter
                            : styles.dropBefore
                          : "";

                        return (
                          <li
                            key={project.projectId}
                            className={`${styles.priorityItem} ${
                              draggingId === project.projectId ? styles.dragging : ""
                            } ${dragOverId === project.projectId ? styles.dragOver : ""} ${dropPlacementClass}`}
                            draggable
                            onDragStart={handleDragStart(project.projectId)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver(project.projectId)}
                            onDrop={handleDrop(project.projectId)}
                          >
                            <div className={styles.priorityNumber}>{index + 1}</div>
                            <div className={styles.priorityInfo}>
                              <div className={styles.priorityTitle}>{project.title}</div>
                              <div className={styles.priorityRole}>
                                지원 직무: {getPositionLabel(commonApplication?.position)}
                              </div>
                            </div>
                            <span className={styles.dragHandle}>⋮⋮</span>
                          </li>
                        );
                      })}
                    </ol>

                    <button
                      type="button"
                      className={styles.modalSubmit}
                      onClick={submitAllApplications}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "제출 중..." : "선택한 프로젝트에 지원하기"}
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        </section>
      </div>
      {applicationModal && (
        <div className={styles.applicationModal} onMouseDown={closeProjectApplication}>
          <div
            className={styles.applicationModalContent}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-application-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.applicationModalClose}
              onClick={closeProjectApplication}
              aria-label="지원서 닫기"
            >
              ×
            </button>
            <h2 id="project-application-title">{applicationModal.project.title} 지원서</h2>
            <p className={styles.applicationModalDescription}>
              이 지원서로 {applicationModal.project.title}에 지원하게 됩니다.
            </p>
            <div className={styles.formGroup}>
              <label htmlFor="projectPosition">지원 직무</label>
              <select
                id="projectPosition"
                value={projectFormPosition}
                onChange={(event) => setProjectFormPosition(event.target.value)}
              >
                <option value="">직무를 선택해주세요</option>
                {applicationModal.project.recruitPositions.map((position) => (
                  <option key={position} value={position}>{getPositionLabel(position)}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="projectMessage">자기소개 및 PR 메시지</label>
              <textarea
                id="projectMessage"
                value={projectFormMessage}
                onChange={(event) => setProjectFormMessage(event.target.value.slice(0, 255))}
                maxLength={255}
                placeholder="자신의 경험과 프로젝트에 기여할 수 있는 부분을 작성해주세요."
              />
              <div className={styles.characterCount}>{projectFormMessage.length} / 255</div>
            </div>
            <button type="button" className={styles.modalSubmit} onClick={saveProjectApplication}>
              지원서 저장하기
            </button>
          </div>
        </div>
      )}
      {cancelTarget && (
        <div className={styles.applicationModal} onMouseDown={() => setCancelTarget(null)}>
          <div
            className={`${styles.applicationModalContent} ${styles.cancelModalContent}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-application-title"
            aria-describedby="cancel-application-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="cancel-application-title">정말 지원을 취소하시겠습니까?</h2>
            <p id="cancel-application-description" className={styles.cancelModalDescription}>
              <strong>{cancelTarget.projectTitle}</strong>
              <span>·</span>
              <strong>{getPositionLabel(cancelTarget.position)}</strong>
            </p>
            <p className={styles.cancelWarning}>취소한 지원서는 복구할 수 없습니다.</p>
            <div className={styles.cancelModalActions}>
              <button
                type="button"
                className={styles.keepApplicationButton}
                onClick={() => setCancelTarget(null)}
              >
                돌아가기
              </button>
              <button
                type="button"
                className={styles.confirmCancelButton}
                onClick={cancelProjectApplication}
              >
                지원 취소하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamBuildApplyPage;
