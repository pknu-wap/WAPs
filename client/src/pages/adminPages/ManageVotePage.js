import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "../../assets/Admin/ManageVote.module.css";
import apiClient from "../../utils/api";
import { getCurrentSemester } from "../../utils/dateUtils";
import SubmitModal from "./SubmitModal";

const ManageVotePage = () => {
    const [voteStatus, setVoteStatus] = useState("NOT_CREATED"); // 투표 상태 (NOT_CREATED, VOTING, ENDED)
    const [semester, setSemester] = useState(null); // 현재 학기
    const [isProcessing, setIsProcessing] = useState(false); // 열기,닫기 버튼 누를 때 로딩 상태

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams(); // 쿼리 파라미터를 위한 상태
    const [projects, setProjects] = useState([]); // 프로젝트 목록 상태
    const [selectedProjects, setSelectedProjects] = useState([]); // 선택된 프로젝트 ID 목록
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setSemester(getCurrentSemester());
    }, []);

    // // 투표 상태 조회
    // useEffect(() => {
    //     const fetchVoteStart = async () => {
    //         try {
    //             const response = await apiClient.get("/admin/vote/status", {
    //                 params: {
    //                     semester: semester
    //                 }
    //             });
    //             setVoteStatus(response.data.status);

    //         } catch (e) {
    //             setError("투표 상태 조회 실패");
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };
    //     fetchVoteStart();
    // }, [semester]);

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
            await apiClient.post("/admin/vote/close", {
                params: {
                    semester: semester
                }
            });
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



    // if (isLoading) return <div>Loading...</div>;
    // if (error) return <div>{error}</div>;

    return (
        <div className={styles.container}>
            {/* NOT_CREATED 상태 */}
            {
                voteStatus === "NOT_CREATED" && (
                    <div>
                        <div className={styles.upperBox}>
                            <div className={styles.upperLeft}>
                                <div className={styles.voteSemester}>{semester}</div>
                                <button
                                    disabled={isProcessing}
                                    onClick={handleSummitProjects}
                                    className={styles.openBtn}
                                >
                                    {isProcessing ? "Opening.." : "OPEN"}
                                </button>
                            </div>
                            <div className={styles.upperRight}>이번 학기 투표에 참가할 프로젝트틀을 선택해주세요!</div>
                        </div>
                        <div className={styles.bar}></div>
                        <div className={styles.cardGrid}>
                            {projects.map((p) => (
                                <div
                                    key={p.projectId}
                                    className={`${styles.card} ${!selectedProjects.includes(p.projectId) ? styles.deselected : ""}`}
                                    onClick={() => toggleProjectSelect(p.projectId)}
                                >
                                    <img src={p.thumbnail} alt="project" className={styles.thumbnail} />
                                    <div className={styles.title}>{p.title}</div>
                                </div>
                            ))}
                        </div>

                        {isModalOpen && (
                            <SubmitModal
                                selectedProjects={selectedProjects}
                                projects={projects}
                                onConfirm={handleOpenVote}
                                onCancel={() => setIsModalOpen(false)}
                            />
                        )}
                    </div>
                )
            }

            {/* VOTING 상태 */}
            {
                voteStatus === "VOTING" && (
                    <div className={styles.PreVoteBox}>
                        <div className={styles.voteSemester}>{semester}</div>
                        <button
                            disabled={isProcessing}
                            onClick={handleCloseVote}
                            className={styles.openBtn}
                        >
                            {isProcessing ? "Closing.." : "CLOSE"}
                        </button>
                    </div>
                )
            }
            {/* ENDED 상태 */}
            {
                voteStatus === "ENDED" && (
                    <div>

                    </div>
                )
            }
        </div >
    );
}

export default ManageVotePage;