import { useState, useEffect } from "react";
import styles from "../../assets/Admin/ManageVote.module.css";
import apiClient from "../../utils/api";
import { getCurrentSemester } from "../../utils/dateUtils";
import SubmitModal from "./SubmitModal";

const ManageVotePage = () => {
    const [voteStatus, setVoteStatus] = useState(""); // 투표 상태 (NOT_CREATED, VOTING, ENDED)
    const [semester, setSemester] = useState(null); // 현재 학기
    const [isProcessing, setIsProcessing] = useState(false); // 열기,닫기 버튼 누를 때 로딩 상태

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(""); // 투표 결과

    const [voteResult, setVoteResult] = useState([]);
    const [projects, setProjects] = useState([]); // 프로젝트 목록 상태
    const [selectedProjects, setSelectedProjects] = useState([]); // 선택된 프로젝트 ID 목록
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setSemester(getCurrentSemester());
    }, []);

    // 투표 상태 조회
    useEffect(() => {
        if (!semester) return;
        const fetchVoteStart = async () => {
            try {
                const response = await apiClient.get("/admin/vote/status", {
                    params: {
                        semester: semester
                    }
                });
                setVoteStatus(response.data.status);

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
                const response = await apiClient.get("/project/list", {
                    params: {
                        projectYear: semester.split("-")[0],
                        semester: semester.split("-")[1]
                    }
                });
                setProjects(response.data.projectsResponse);
            } catch (e) {
                setError("프로젝트 목록 조회 실패");
            }
        };
        fetchProjects();
    }, [voteStatus, semester]);

    // 프젝목록을 모두 저장
    useEffect(() => {
        if (projects.length > 0) {
            setSelectedProjects(projects.map(p => p.projectId));
        }
    }, [projects]);

    // 투표 열기 핸들러
    const handleOpenVote = async () => {
        if (voteStatus !== "NOT_CREATED") return;

        try {
            setIsProcessing(true);

            await apiClient.post("/admin/vote/open",
                {
                    projectIds: selectedProjects
                },
                {
                    params: { semester: semester }
                }
            );

            setVoteStatus("VOTING");
            setIsModalOpen(false);
        } catch (e) {
            alert("투표 열기에 실패했습니다");
        } finally {
            setIsProcessing(false);
        }
    };

    // 투표 닫기 핸들러
    const handleCloseVote = async () => {
        if (voteStatus !== "VOTING") return;

        try {
            setIsProcessing(true);
            await apiClient.post(
                "/admin/vote/closed",
                {},
                { params: { semester } }
            );
            setVoteStatus("ENDED");
        } catch (e) {
            setError("투표 종료에 실패했습니다.");
        } finally {
            setIsProcessing(false);
        }
    }

    // 프로젝트 선택 토글 로직
    const toggleProjectSelect = (id) => {
        setSelectedProjects((prev) =>
            prev.includes(id)
                ? prev.filter((pid) => pid !== id)
                : [...prev, id]
        )
    }

    // 투표할 프로젝트 제출 핸들러
    const handleSummitProjects = () => {
        if (selectedProjects.length === 0) {
            alert("최소 한 개 이상의 프로젝트를 선택해야 합니다.");
            return;
        }
        setIsModalOpen(true);
    };


    // ENDED 상태일 때 투표 결과 요청하기
    useEffect(() => {
        if (voteStatus !== "ENDED" || !semester) return;

        const fetchVoteResult = async () => {
            try {
                const response = await apiClient.get("vote/result");
                setVoteResult(response.data); // 투표 결과 저장
            } catch (e) {
                setError("투표 결과 조회 실패");
            }
        };
        fetchVoteResult();
    }, [voteStatus, semester]);

    // 컴포넌트들
    const HeaderSection = ({ semester, isProcessing, voteStatus, onClick }) => {
        return (
            <div className={styles.upperBox}>
                <div className={styles.upperLeft}>
                    <div className={styles.voteSemester}>{semester}</div>
                    <button
                        disabled={isProcessing}
                        onClick={onClick}
                        className={voteStatus === "NOT_CREATED" ? styles.openBtn : styles.closeBtn}
                    >
                        {isProcessing
                            ? voteStatus === "NOT_CREATED"
                                ? "Opening..."
                                : "Closing..."
                            : voteStatus === "NOT_CREATED"
                                ? "OPEN"
                                : "CLOSE"}
                    </button>
                </div>
            </div>
        );
    };

    const NotCreatedView = ({
        semester,
        projects,
        selectedProjects,
        toggleProjectSelect,
        openModal
    }) => {
        return (
            <>
                <div className={styles.upperRight}>프로젝트를 선택해주세요!</div>
                <div className={styles.cardGrid}>
                    {projects.map((p) => (
                        <div
                            key={p.projectId}
                            className={`${styles.card} ${!selectedProjects.includes(p.projectId) ? styles.deselected : ""}`}
                            onClick={() => toggleProjectSelect(p.projectId)}
                        >
                            <img src={p.thumbnail} className={styles.thumbnail} alt="" />
                            <div className={styles.title}>{p.title}</div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    const VotingView = () => {
        return (
            <div className={styles.underBox}>
                <div className={styles.resultTitle}>투표 결과</div>

                <div className={styles.resultBody}>
                    <div className={styles.loadingBox}>투표를 기다려주세요</div>

                    <div className={styles.publicBtns}>
                        <button className={styles.publicBtnDisable}>공개</button>
                        <button className={styles.publicBtnDisable}>비공개</button>
                    </div>
                </div>
            </div>
        );
    };

    const EndedView = () => {
        return (
            <div className={styles.underBox}>
                <div className={styles.resultTitle}>투표 결과</div>

                <div className={styles.resultBody}>
                    <div className={styles.tableWrapper}>
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
                                    voteResult
                                        .sort((a, b) => b.voteCount - a.voteCount)
                                        .map((result, idx) => (
                                            <tr ket={idx}>
                                                <td>{idx + 1}</td>
                                                <td>{result.projectName}</td>
                                                <td>{result.voteCount}</td>
                                                <td>{(result.voteRate * 100).toFixed(1)}%</td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.publicBtns}>
                        <button className={styles.publicBtn}>공개</button>
                        <button className={styles.publicBtn}>비공개</button>
                    </div>
                </div>
            </div>
        );
    };


    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className={styles.container}>

            <HeaderSection
                semester={semester}
                isProcessing={isProcessing}
                voteStatus={voteStatus}
                onClick={
                    voteStatus === "NOT_CREATED"
                        ? handleSummitProjects    // OPEN 누르면 모달
                        : handleCloseVote         // CLOSE
                }
            />

            <div className={styles.bar}></div>

            {voteStatus === "NOT_CREATED" && (
                <NotCreatedView
                    semester={semester}
                    projects={projects}
                    selectedProjects={selectedProjects}
                    toggleProjectSelect={toggleProjectSelect}
                    openModal={handleSummitProjects}
                />
            )}

            {voteStatus === "VOTING" && <VotingView />}

            {voteStatus === "ENDED" && <EndedView />}

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

}

export default ManageVotePage;