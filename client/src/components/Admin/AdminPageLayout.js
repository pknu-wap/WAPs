import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import styles from "../../assets/Admin/AdminPageLayout.module.css";
import SideBar from "./SideBar";
import Cookies from "js-cookie";

// 어드민 페이지 공용 레이아웃
const AdminPageLayout = () => {
    // 유저 이름 저장
    const [userName, setUserName] = useState(Cookies.get("userName") || null);

    // 유저 이름 가져오기
    useEffect(() => {
        const token = Cookies.get("authToken");
        const savedUserName = Cookies.get("userName");
        if (token && savedUserName) setUserName(savedUserName);
    }, []);

    const navigate = useNavigate();

    const handleExit = () => {
        // 이전 위치를 가져와서 뒤로 돌려보냄
        const previousPage = Cookies.get("previousPage") || "/ProjectPage";
        Cookies.remove("previousPage"); // 사용 후 쿠키 삭제
        navigate(previousPage);
    };


    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>

                <span className={styles.logo} onClick={handleExit}>WAPs</span>

                <div className={styles.headerRight}>
                    <div className={styles.adminUser}>
                        <span>관리자 {userName} 님</span>
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