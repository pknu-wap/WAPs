import styles from "../../assets/Admin/ManagePermission.module.css";

const ManagePermissionPage = () => {
    return (
        <div className={styles.container}>
            <div className={styles.Box}>
                <div className={styles.header}>
                    <span>목록</span>
                    <button className={styles.onlyBtn}>ONLY MEMBER</button>
                </div>
                <div className={styles.memberList}></div>
            </div>
            <div className={styles.Box}>
                <span className={styles.header}>권한 변경</span>
                <div className={styles.changeContent}>
                    <div className={styles.controler}>
                        <span style={{ fontSize: "20px", fontWeight: "700" }}>다음으로 권한 변경:</span>
                        <button className={styles.role}></button>
                        <button className={styles.summit}>적용</button>
                    </div>
                    <div className={styles.changeList}></div>
                </div>
            </div>
        </div>
    );
}

export default ManagePermissionPage;