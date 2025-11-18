import { useState, useEffect } from "react";
import styles from "../../assets/Admin/ManageVote.module.css";
import apiClient from "../../utils/api";
import { getCurrentSemester } from "../../utils/dateUtils";

const ManageVotePage = () => {
    const [VoteStatus, setVoteStatus] = useState(null); // 투표 상태
    const [semester, setSemester] = useState(null); // 현재 학기
    const [isProcessing, setIsProcessing] = useState(false); // 열기,닫기 버튼 누를 때 로딩 상태
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVoteStart = async () => {
            try {
                const response = await apiClient.post("/vote/now");

                // 투표 전
                if ((response.data.isOpen) === true) {
                    setVoteStatus("BEFORE");

                    return (
                        <div className={styles.beforeVoteBox}>
                            <button className={styles.voteSemester}>{getCurrentSemester()}</button>
                            <div className={styles.openBtn}>OPEN</div>
                        </div>
                    );
                } else {

                }

            } catch (e) {
                setError("투표 상태 조회 실패");
            } finally {
                setIsLoading(false);
            }
        };
        fetchVoteStart();
    }, []);

    return (
        <div className={styles.container}>

        </div>
    );
}

export default ManageVotePage;