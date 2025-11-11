import styles from "../../assets/Admin/SideBar.module.css";
// 어드민 페이지 사이드바 컴포넌트
const SideBar = () => {
    return (
        <div className={styles.container}>
            <div className={styles.title}>
                <div className={styles.eng}>ADMINISTRATOR PAGE</div>
                <div className={styles.kr}>관리자 페이지</div>
            </div>
            <div className={styles.pageBtn}>
                <button>투표관리</button>
                <button>팀빌딩</button>
                <button>사용자 권한 관리</button>
                <button>주요 행사 일정 관리</button>
            </div>
        </div>
    );
}

export default SideBar;