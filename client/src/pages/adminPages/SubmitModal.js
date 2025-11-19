import styles from "../../assets/Admin/SubmitModal.module.css"

const SubmitModal = ({ selectedProjects, projects, onConfirm, onCancel }) => {
    const selectedList = projects.filter(p => selectedProjects.includes(p.projectId));
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
                {/* 헤더 */}
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div style={{ fontWeight: '700' }}>제출확인</div>
                        <button style={{ cursor: 'pointer', marginTop: '-15px' }} onClick={onCancel}>✕</button>
                    </div>
                    <div>선택한 프로젝트를 다시 한번 확인해주세요. 아 제발요.</div>
                </div>

                {/* 선택된 프로젝트 목록 */}
                <div className={styles.selectedTitle}>선택한 프로젝트</div>
                <ul>
                    {selectedList.map(p => (
                        <li key={p.projectId}>{p.title}</li>
                    ))}
                </ul>

                {/* 버튼 */}
                <div className={styles.modalActions}>
                    <button onClick={onCancel}>취소</button>
                    <button onClick={onConfirm}>확인</button>
                </div>
            </div>
        </div >
    );
};

export default SubmitModal;
