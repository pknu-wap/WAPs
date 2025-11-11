import { useNavigate } from "react-router-dom";
import styles from "../../assets/Admin/AdminPageLayout.module.css";
import SideBar from "./SideBar";

// 어드민 페이지 공용 레이아웃
const AdminPageLayout = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        // 뒤로 갈 히스토리가 있으면 뒤로 이동 없으면 /admin으로 폴백
        try {
            if (window.history.length > 1) {
                navigate(-1);
            } else {
                navigate('/admin');
            }
        } catch (e) {
            // 폴백
            navigate('/admin');
        }
    };


    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>

                <span className={styles.logo} onClick={() => navigate("/ProjectPage")}>WAPs</span>

                <div className={styles.headerRight}>
                    <div className={styles.adminUser}>
                        <span>관리자</span>
                        <span>님</span>
                    </div>
                    <div className={styles.backBtn} onClick={handleBack}>✕</div>
                </div>
            </div>

            {/* 메인 */}
            <div className={styles.main}>
                <SideBar />
                <div className={styles.contentsBox} />
            </div>

        </div>
    );
}

export default AdminPageLayout;