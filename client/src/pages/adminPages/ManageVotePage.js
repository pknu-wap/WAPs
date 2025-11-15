import { useState, useEffect } from "react";
import styles from "../../assets/Admin/ManageVote.module.css";
import apiClient from "../../utils/api";

const ManageVotePage = () => {
    const [votingStatus, setVotingStatus] = useState("BEFORE"); // 투표 상태 정보 (BEFORE, IN_PROGRESS, AFTER)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVoteStart = async () => {
            try {
                const response = await apiClient.post("/admin/vote/open");
                setVotingStatus("IN_PROGRESS");
            } catch {

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