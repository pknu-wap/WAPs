import { useLocation, useNavigate } from "react-router-dom";
import styles from "../../assets/Admin/SideBar.module.css";

// 어드민 페이지 사이드바 컴포넌트
const SideBar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // 페이지별 버튼과 경로를 매핑
    const buttons = [
        { text: "투표 관리", path: "/admin/vote" },
        { text: "팀빌딩 관리", path: "/admin/teambuild" },
        { text: "사용자 권한 관리", path: "/admin/permission" },
        { text: "주요 행사 일정 관리", path: "/admin/plan" }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.title}>
                <div className={styles.eng}>ADMINISTRATOR PAGE</div>
                <div className={styles.kr}>관리자 페이지</div>
            </div>
            <div className={styles.pageBtn}>
                {buttons.map((button) => (
                    <button key={button.text}
                        className={location.pathname === button.path ? styles.active : ''}
                        onClick={() => navigate(button.path)}
                    >
                        {button.text}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default SideBar;