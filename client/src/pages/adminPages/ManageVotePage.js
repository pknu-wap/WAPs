import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "../../assets/Admin/ManageVote.module.css";
import apiClient from "../../utils/api";
import { getCurrentSemester } from "../../utils/dateUtils";

const ManageVotePage = () => {
    const [voteStatus, setVoteStatus] = useState(null); // 투표 상태 (PRE_VOTE, VOTING, ENDED)
    const [semester, setSemester] = useState(null); // 현재 학기
    const [isProcessing, setIsProcessing] = useState(false); // 열기,닫기 버튼 누를 때 로딩 상태

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams(); // 쿼리 파라미터를 위한 상태
    const [projects, setProjects] = useState([]); // 프로젝트 목록 상태
    const [selectedProjects, setSelectedProjects] = useState([]); // 선택된 프로젝트 ID 목록

    useEffect(() => {
        setSemester(getCurrentSemester());
    }, []);

    // 투표 상태 조회
    // useEffect(() => {
    //     const fetchVoteStart = async () => {
    //         try {
    //             const response = await apiClient.post("/vote/now");
    //             setVoteStatus(response.data.isOpen);

    //         } catch (e) {
    //             setError("투표 상태 조회 실패");
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };
    //     fetchVoteStart();
    // }, []);

    useEffect(() => {
        if (!semester) return;

    })
    // 투표 열기 핸들러
    const handleOpenVote = async () => {
        if (voteStatus !== "PRE_VOTE") return;

        try {
            setIsLoading(true);
            await apiClient.post("/admin/vote/open", { semester: semester });

            setVoteStatus("VOTING");
        } catch (e) {
            setError("투표 열기에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // 투표 닫기 핸들러
    const handleCloseVote = async () => {
        if (voteStatus !== "VOTING") return;

        try {
            setIsProcessing(true);
            await apiClient.post("/admin/vote/close", { semester: semester });
            setVoteStatus("ENDED");
        } catch (e) {
            setError("투표 종료에 실패했습니다.");
        } finally {
            setIsProcessing(false);
        }
    }


    //if (isLoading) return <div>Loading...</div>;
    //if (error) return <div>{error}</div>;
    return (
        <div className={styles.container}>

            <div className={styles.upperBox}>
                <div className={styles.voteSemester}>{semester}</div>
                <button
                    disabled={isProcessing}
                    onClick={handleOpenVote}
                    className={styles.openBtn}
                >
                    {isProcessing ? "Opening.." : "OPEN"}
                </button>
            </div>
            <div className={styles.bar}></div>
            <div className={styles.cardGrid}>

            </div>
            <button className={styles.summit}>제출</button>






            {/* PRE_VOTE 상태 */}
            {voteStatus === "PRE_VOTE" && (
                <div>
                    <div className={styles.upperBox}>
                        <div className={styles.voteSemester}>{semester}</div>
                        <button
                            disabled={isProcessing}
                            onClick={handleOpenVote}
                            className={styles.openBtn}
                        >
                            {isProcessing ? "Opening.." : "OPEN"}
                        </button>
                    </div>
                </div>

            )}

            {/* VOTING 상태 */}
            {voteStatus === "VOTING" && (
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
            )}
            {/* ENDED 상태 */}
            {voteStatus === "ENDED" && (
                <div>

                </div>
            )}
        </div>
    );
}

export default ManageVotePage;