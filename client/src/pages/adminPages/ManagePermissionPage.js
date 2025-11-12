import { useState, useEffect } from "react";
import styles from "../../assets/Admin/ManagePermission.module.css";
import apiClient from "../../utils/api";
// 데이터 로딩
const ManagePermissionPage = () => {
    const [users, setUsers] = useState([]); // 유저 상태
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 페이지네이션 상태
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10); // 기본 10개씩
    const [hasNext, setHasNext] = useState(false); // 다음 페이지 존재 여부


    // 사용자 권한 목록 가져오기
    useEffect(() => {
        const fetchUserRoles = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiClient.get("/admin/role", {
                    params: {
                        page: page,
                        size: size,
                    },
                });

                setUsers(response.data.content || []);  // 유저 목록 저장
                setHasNext(response.data.hasNext || false); // 다음 페이지 여부 저장
                // 다음 페이지 여부 저장
            } catch (err) {
                console.error("사용자 권한 목록 불러오기 실패:", err);
                setError("사용자 권한 목록을 불러오는 데 실패했습니다.");
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserRoles();
    }, [page, size]); // 이 둘값이 변경되면 API 다시 호출

    // size 변경 핸들러
    const handleSizeChange = (newSize) => {
        setSize(newSize);
        setPage(0); // size가 바뀌면 1페이지로 리셋
    };

    // 이전 페이지 버튼 핸들러
    const handlePrevPage = () => {
        // 0보다 클 때만 1 감수
        if (page > 0) {
            setPage(page - 1);
        }
    };

    const handleNextPage = () => {
        // hasNext가 true일때만 1증가
        if (hasNext) {
            setPage(page + 1);
        }
    };


    return (
        <div className={styles.container}>
            {/* 사용자 목록 박스 */}
            <div className={styles.Box}>
                {/* 헤더 */}
                <div className={styles.header}>
                    <span>목록</span>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <select
                            value={size}
                            onChange={(e) => handleSizeChange(Number(e.target.value))}
                            style={{ marginRight: '10px', padding: '5px' }} // 임시 스타일
                        >
                            <option value={10}>10개씩 보기</option>
                            <option value={20}>20개씩 보기</option>
                            <option value={25}>25개씩 보기</option>
                        </select>
                        <button className={styles.onlyBtn}>ONLY MEMBER</button>
                    </div>
                </div>

                {/* 유저 목록 */}
                <div className={styles.userList}>
                    {isLoading ? (
                        <p>로딩 중...</p>
                    ) : error ? (
                        <p>{error}</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>NAME</th>
                                    <th>EMAIL</th>
                                    <th>ROLE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>{user.role}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4">불러올 데이터가 없습니다.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 페이지 네이션 UI */}
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '1.2rem' }}>
                    <button onClick={handlePrevPage} disabled={page === 0 || isLoading}>
                        &lt;&lt;
                    </button>

                    {/* API는 0부터 시작하므로 +1 해서 보여줌 */}
                    <span style={{ margin: '0 15px' }}>
                        {page + 1}
                    </span>

                    <button onClick={handleNextPage} disabled={!hasNext || isLoading}>
                        &gt;&gt;
                    </button>
                </div>

            </div>

            {/* 권한 변경 박스 */}
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