import { useNavigate, Outlet } from "react-router-dom";
import styles from "../../assets/Admin/AdminPageLayout.module.css";
import SideBar from "./SideBar";

// 어드민 페이지 공용 레이아웃
const AdminPageLayout = () => {
    const navigate = useNavigate();

    const handleExit = () => {
        navigate("/ProjectPage");
    };

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>

                <span className={styles.logo} onClick={handleExit}>WAPs</span>

                <div className={styles.headerRight}>
                    <div className={styles.adminUser}>
                        <span>관리자</span>
                        <span>님</span>
                    </div>
                    <div className={styles.exitBtn} onClick={handleExit}>✕</div>
                </div>
            </div>

            {/* 메인 */}
            <div className={styles.main}>
                <SideBar />
                <div className={styles.contentsBox} >
                    <Outlet />
                </div>
            </div>

        </div>
    );
}

export default AdminPageLayout;