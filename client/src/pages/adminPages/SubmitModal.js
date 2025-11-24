import styles from "../../assets/Admin/SubmitModal.module.css"

// 투표 관리 페이제 프로젝트 제출 모달 컴포넌트
const SubmitModal = ({ selectedProjects, projects, onConfirm, onCancel }) => {
    const selectedList = projects.filter(p => selectedProjects.includes(p.projectId));

    // 바깥 클릭 시 종료
    const handleOverlayClick = (e) => {
        // modalBox 내부 클릭이면 닫히지 않게
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div style={{ fontWeight: '700' }}>제출확인</div>
                        <button style={{ cursor: 'pointer', marginTop: '-15px' }} onClick={onCancel}>✕</button>
                    </div>
                    <div>선택한 프로젝트를 다시 한번 확인해주세요. 아 제발요.</div>
                </div>

                {/* 선택된 프로젝트 목록 */}
                <div className={styles.selectedProjects}>
                    <div className={styles.selectedTitle}>선택한 프로젝트 </div>
                    <div className={styles.selectedNumber}>({selectedList.length}개)</div>
                </div>

                <ul>
                    {selectedList.map(p => (
                        <li key={p.projectId}>{p.title}</li>
                    ))}
                </ul>

                {/* 버튼 */}
                <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={onCancel}>취소</button>
                    <button className={styles.submitBtn} onClick={onConfirm}>제출</button>
                </div>
            </div>
        </div >
    );
};

export default SubmitModal;
