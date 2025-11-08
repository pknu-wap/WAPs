import { Outlet } from "react-router-dom";
import styles from "../../assets/Admin/AdminCommon.module.css";

// 어드민 페이지용 레이아웃 적용을 위한 컴포넌트
const AdminLayout = () => {
    return (
        <div className={styles.adminContainer}>
            <Outlet />
        </div>
    );
}

export default AdminLayout;