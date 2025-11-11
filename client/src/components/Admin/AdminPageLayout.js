import styles from "../../assets/Admin/AdminPageLayout.module.css";
import SideBar from "./SideBar";

// 어드민 페이지 공용 레이아웃
const AdminPageLayout = () => {
    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div>
                여기에 헤더
            </div>

            {/* 메인 */}
            <div class>
                <SideBar />
                <div className="contentsBox" />
            </div>

        </div>
    );
}

export default AdminPageLayout;