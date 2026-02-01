import React, { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { teamBuildApi } from "../api/team-build";
import LoadingPage from "../components/LoadingPage";
import wapsLogo from "../assets/img/waps_logo.png";
import styles from "../assets/TeamBuildApply.module.css";

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

const formatApiError = (err, fallback) => {
  if (typeof err === "string") return err;
  if (err?.response?.data) {
    const data = err.response.data;
    if (typeof data === "string") return data;
    return data.message || data.error || fallback;
  }
  return err?.message || fallback;
};

function TeamBuildApplyPage() {
  const navigate = useNavigate();
  const cartRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [projects, setProjects] = useState([]);
  const [commonApplication, setCommonApplication] = useState(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [formPosition, setFormPosition] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [messageLimitReached, setMessageLimitReached] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = Cookies.get("authToken") || window.localStorage.getItem("authToken") || "";
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      const token = Cookies.get("authToken") || window.localStorage.getItem("authToken") || "";
      if (!token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setLoadError("");
      try {
        const status = await teamBuildApi.getApplyStatus();
        if (!active) return;
        const applied = Boolean(status?.hasApplied);
        setHasApplied(applied);

        if (!applied) {
          const projectList = await teamBuildApi.getApplyProjects();
          if (!active) return;
          setProjects(Array.isArray(projectList) ? projectList : []);
        }
      } catch (err) {
        if (!active) return;
        setLoadError(formatApiError(err, "프로젝트 목록을 불러오지 못했습니다."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, []);

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

  const canSelectProjects = Boolean(commonApplication);
  const selectedCount = selectedProjectIds.length;

  const getPositionLabel = (value) => POSITION_LABELS[value] || value;

  const openApplicationModal = () => {
    setFormPosition(commonApplication?.position || "");
    setFormMessage(commonApplication?.message || "");
    setMessageLimitReached(Boolean(commonApplication?.message?.length >= 255));
    setIsApplicationModalOpen(true);
  };

  const closeApplicationModal = () => {
    setIsApplicationModalOpen(false);
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
    setIsApplicationModalOpen(false);
    alert("지원서가 저장되었습니다! 이제 프로젝트를 선택할 수 있습니다.");
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

  const openCartModal = () => {
    if (!commonApplication) {
      alert("먼저 지원서를 작성해주세요.");
      return;
    }
    if (selectedProjectIds.length === 0) {
      alert("먼저 프로젝트를 선택해주세요.");
      return;
    }
    if (selectedProjectIds.length > MAX_SELECTION) {
      alert(`프로젝트는 최대 ${MAX_SELECTION}개까지만 지원할 수 있습니다.`);
      return;
    }
    setIsCartModalOpen(true);
  };

  const closeCartModal = () => {
    setIsCartModalOpen(false);
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragStart = (projectId) => (event) => {
    setDraggingId(projectId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(projectId));
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragOver = (projectId) => (event) => {
    if (!draggingId || draggingId === projectId) return;
    event.preventDefault();
    setDragOverId(projectId);
  };

  const handleDrop = (projectId) => (event) => {
    event.preventDefault();
    if (!draggingId || draggingId === projectId) return;

    setSelectedProjectIds((prev) => {
      const next = [...prev];
      const fromIndex = next.indexOf(draggingId);
      const toIndex = next.indexOf(projectId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDragOverId(null);
  };

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
      closeCartModal();
      navigate(-1);
    } catch (err) {
      alert(formatApiError(err, "지원 중 오류가 발생했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToCart = () => {
    cartRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
            지원서를 작성하고 원하는 프로젝트들에 한 번에 지원하세요!
          </div>
        </div>

        <div className={styles.backRow}>
          <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
            <span className={styles.backArrow}>←</span> 뒤로가기
          </button>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>지원서 작성</div>
          </div>
          {!commonApplication ? (
            <>
              <div className={styles.infoBox}>
                먼저 지원서를 작성해주세요.
                <br />
                작성된 지원서로 여러 프로젝트에 지원할 수 있습니다.
              </div>
              <button type="button" className={styles.primaryCta} onClick={openApplicationModal}>
                지원서 작성하기
              </button>
            </>
          ) : (
            <div className={styles.applicationPreview}>
              <div>
                <div className={styles.previewLabel}>지원 직무</div>
                <div className={styles.previewValue}>{getPositionLabel(commonApplication.position)}</div>
              </div>
              <div>
                <div className={styles.previewLabel}>자기소개 및 PR 메시지</div>
                <div className={styles.previewValue}>{commonApplication.message}</div>
              </div>
              <button type="button" className={styles.secondaryCta} onClick={openApplicationModal}>
                지원서 수정
              </button>
            </div>
          )}
        </section>

        <section className={styles.panel} ref={cartRef}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              지원할 프로젝트
              <span className={styles.badge}>{selectedCount}</span>
            </div>
            {selectedCount > 0 && (
              <button type="button" className={styles.clearButton} onClick={clearCart}>
                전체 삭제
              </button>
            )}
          </div>

          <div className={styles.cartBox}>
            {selectedProjects.length === 0 ? (
              <div className={styles.cartEmpty}>
                아직 선택된 프로젝트가 없습니다.
                <br />
                프로젝트를 선택해 주세요.
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

          <button
            type="button"
            className={styles.applyButton}
            onClick={openCartModal}
            disabled={selectedCount === 0 || selectedCount > MAX_SELECTION}
          >
            선택한 프로젝트에 지원하기
          </button>
        </section>

        <section className={styles.projectsSection}>
          {projects.length === 0 ? (
            <div className={styles.emptyProjects}>현재 지원 가능한 프로젝트가 없습니다.</div>
          ) : (
            projects.map((project) => {
              const isSelected = selectedProjectIds.includes(project.projectId);
              return (
                <div
                  key={project.projectId}
                  className={`${styles.projectCard} ${isSelected ? styles.projectSelected : ""}`}
                >
                  <div className={styles.projectHeader}>
                    <div className={styles.projectTitle}>{project.title}</div>
                    {isSelected && <div className={styles.projectCheck}>✓</div>}
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
                    className={`${styles.projectButton} ${isSelected ? styles.projectButtonSelected : ""}`}
                    onClick={() =>
                      isSelected ? removeFromCart(project.projectId) : addToCart(project.projectId)
                    }
                    disabled={!canSelectProjects}
                  >
                    {!canSelectProjects
                      ? "지원서 작성 필요"
                      : isSelected
                      ? "선택됨"
                      : "프로젝트 선택"}
                  </button>
                </div>
              );
            })
          )}
        </section>
      </div>

      {selectedCount > 0 && (
        <button type="button" className={styles.floatingCart} onClick={scrollToCart}>
          {selectedCount}
        </button>
      )}

      {isApplicationModalOpen && (
        <div
          className={styles.modal}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeApplicationModal();
          }}
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>지원서 작성</div>
                <div className={styles.modalSubtitle}>
                  이 지원서로 선택한 모든 프로젝트에 지원됩니다.
                </div>
              </div>
              <button type="button" className={styles.modalClose} onClick={closeApplicationModal}>
                ×
              </button>
            </div>

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
              지원서 작성하기
            </button>
          </div>
        </div>
      )}

      {isCartModalOpen && (
        <div
          className={styles.modal}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeCartModal();
          }}
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>프로젝트 지원</div>
                <div className={styles.modalSubtitle}>
                  프로젝트를 드래그하여 원하는 순서로 변경해주세요.
                </div>
              </div>
              <button type="button" className={styles.modalClose} onClick={closeCartModal}>
                ×
              </button>
            </div>

            <div className={styles.priorityGuide}>
              <strong>지원 우선순위 설정</strong>
              <span>· 1순위부터 제출됩니다.</span>
            </div>

            <ol className={styles.priorityList}>
              {selectedProjects.map((project, index) => (
                <li
                  key={project.projectId}
                  className={`${styles.priorityItem} ${
                    draggingId === project.projectId ? styles.dragging : ""
                  } ${dragOverId === project.projectId ? styles.dragOver : ""}`}
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
              ))}
            </ol>

            <button
              type="button"
              className={styles.modalSubmit}
              onClick={submitAllApplications}
              disabled={isSubmitting}
            >
              {isSubmitting ? "제출 중..." : "선택한 프로젝트에 지원하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamBuildApplyPage;
