import styles from '../../assets/Admin/ManageTeamBuild.module.css';

const ManageTeamBuildPage = () => {
    return (
        <div className={styles.container}>
            <div className={styles.upperBox}></div>


            {/* 하단 버튼들 */}
            <div className={styles.underBox}>
                <div className={styles.underItems}>
                    <div className={styles.btnSet}>
                        <div>지원 CSV</div>
                        <button className={styles.exportBtn}>받아오기</button>
                    </div>
                    <div className={styles.btnSet}>
                        <div>모집 CSV</div>
                        <button className={styles.exportBtn}>받아오기</button>
                    </div>
                    <button className={styles.teamBuildBtn}>
                        팀 빌딩 알고리즘 실행
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ManageTeamBuildPage;