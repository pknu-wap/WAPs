import { useState, useEffect, useCallback } from "react";
import styles from "../../assets/Admin/ManagePermission.module.css";
import apiClient from "../../utils/api";

const ROLES = ["ROLE_ADMIN", "ROLE_MEMBER", "ROLE_USER", "ROLE_GUEST"];

// 데이터 로딩
const ManagePermissionPage = () => {
    const [users, setUsers] = useState([]); // 유저 상태
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 페이지네이션 상태
    const [page, setPage] = useState(0);
    const [size] = useState(12); // 12개 고정
    const [hasNext, setHasNext] = useState(false); // 다음 페이지 존재 여부

    // 권한 변경 상태
    const [selectedUserMap, setSelectedUserMap] = useState(new Map()); // 선택된 사용자 ID
    const [newRole, setNewRole] = useState(""); // 선택된 새 권한;
    const [isUpdating, setIsUpdating] = useState(false); // 적용 버튼 로딩 상태
    const [updateError, setUpdateError] = useState(null); // 적용 시 에러 상태
    const [roleFilter, setRoleFilter] = useState(""); // 역할 필터를 위한 상태

    // 사용자 권한 목록 가져오기
    const fetchUserRoles = useCallback(async (currentPage, currentSize, selectedRole) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.get("/admin/role", {
                params: {
                    page: currentPage,
                    size: currentSize,
                    ...(selectedRole ? { role: selectedRole } : {})
                }
            });

            setUsers(response.data.content || []); // 유저 목록 저장
            setHasNext(response.data.hasNext || false); // 다음 페이지 여부 저장
        } catch (err) {
            console.error("사용자 권한 목록 불러오기 실패:", err);
            setError("사용자 권한 목록을 불러오는 데 실패했습니다.");
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserRoles(page, size, roleFilter);
    }, [fetchUserRoles, page, size, roleFilter]); // fetchUserRoles, page, size가 변경될 때 호출

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

    // 사용자 선택 핸들러
    const handleUserRowClick = (user) => {
        setSelectedUserMap(prevMap => {
            const newMap = new Map(prevMap);
            if (newMap.has(user.id)) {
                // 이미 선택된 유저면 선택 해제
                newMap.delete(user.id);
            } else {
                // 선택되지 않은 유저면 선택
                newMap.set(user.id, user);
            }
            return newMap;
        });
    };

    // 적용 버튼 핸들러
    const handleSubmitChange = async () => {
        if (!newRole) {
            alert("먼저 변경할 권한을 선택하세요");
            return;
        }
        // Map의 size로 선택 여부 확인
        if (selectedUserMap.size === 0) {
            alert("권한을 변경할 사용자를 한 명 이상 선택하세요");
            return;
        }

        setIsUpdating(true);
        setUpdateError(null);

        try {
            // 맵의 키 목록을 array로 변환하여 API 호출
            const response = await apiClient.patch("/admin/role/user", {
                newRole: newRole,
                userIds: Array.from(selectedUserMap.keys())
            })

            alert(`${response.data.updatedUserCount}명의 사용자가 ${response.data.changeTo} 권한으로 변경되었습니다.`);

            // 상태 초기화
            setSelectedUserMap(new Map()); // 오른쪽 박스의 목록 초기화
            setNewRole("");

            // 목록 새로고침
            fetchUserRoles(page, size);
        } catch (err) {
            console.error("권한 변경 실패: ", err);
            const errMsg = err.response?.data?.message || "권한 변경에 실패했습니다.";
            setUpdateError(errMsg);
            alert(`권한 변경 실패: ${errMsg}`);
        } finally {
            setIsUpdating(false);
        }
    };

    // 필터 변경 핸들러
    const handleRoleFilterChange = (e) => {
        setRoleFilter(e.target.value);
        setPage(0); // 중요: 필터가 바뀌면 반드시 1페이지(index 0)로 돌아가야 함
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
                            className={styles.filterSelect}
                            value={roleFilter}
                            onChange={handleRoleFilterChange}
                        >
                            <option value="">ALL</option>
                            {ROLES.map((role) => (
                                <option key={role} value={role}>
                                    {role.replace("ROLE_", "")}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 유저 목록 */}
                <div className={styles.userContent}>
                    <div className={styles.userList}>
                        {isLoading ? (
                            <table>
                                <thead></thead>
                            </table>
                        ) : error ? (
                            <p>{error}</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>NAME</th>
                                        <th>EMAIL</th>
                                        <th>ROLE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length > 0 ? (
                                        users.map((user) => (
                                            <tr
                                                key={user.id}
                                                onClick={() => handleUserRowClick(user)}
                                                className={selectedUserMap.has(user.id) ? styles.selectedRow : ""}
                                                style={{ cursor: 'pointer' }}
                                            >

                                                <td style={{ textAlign: "right" }}>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>{user.role}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3">불러올 데이터가 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* 페이지 네이션 UI */}
                    <div className={styles.pageNation}>
                        <button onClick={handlePrevPage} disabled={page === 0 || isLoading} className={styles.prevPage}>
                            &lt;&lt;
                        </button>

                        {/* 0부터 시작하므로 +1 해서 보여줌 */}
                        <span style={{ margin: '0 15px' }}>
                            {page + 1}
                        </span>

                        <button onClick={handleNextPage} disabled={!hasNext || isLoading} className={styles.nextPage}>
                            &gt;&gt;
                        </button>
                    </div>
                </div>
            </div>
            {/* 권한 변경 박스 */}
            <div className={styles.Box}>
                <span className={styles.header}>권한 변경</span>
                <div className={styles.changeContent}>
                    {/* 권한 선택 및 적용 버튼 UI */}
                    <div className={styles.controler}>
                        <span style={{ fontSize: "18px", fontWeight: "700", minWidth: "77px" }}>
                            다음으로 권한 변경:
                        </span>

                        {/* Role 선택 드롭다운 */}
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className={styles.roleDropdown}
                        >
                            <option value="">권한 선택</option>
                            {ROLES.map((role) => (
                                <option key={role} value={role}>
                                    {role.replace("ROLE_", "")}
                                </option>
                            ))}
                        </select>

                        {/* 적용 버튼 */}
                        <button
                            className={styles.adjust}
                            onClick={handleSubmitChange}
                            disabled={isUpdating}
                        >
                            {isUpdating ? "적용 중..." : "적용"}
                        </button>
                    </div>

                    {/* 선택된 사용자 목록 */}
                    <div className={styles.changeList}>
                        {selectedUserMap.size === 0 ? (
                            <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
                                왼쪽 목록에서 사용자를 클릭하여 추가하세요.
                            </p>
                        ) : (
                            <table>
                                <tbody>
                                    {/* Map에 저장된 user 객체들을 순회하며 행 생성 */}
                                    {Array.from(selectedUserMap.values()).map(user => (
                                        <tr key={user.id} onClick={() => handleUserRowClick(user)} style={{ cursor: 'pointer' }}>
                                            <td style={{ textAlign: "right" }}>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>{user.role}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {updateError && <p style={{ color: 'red', textAlign: 'center' }}>{updateError}</p>}
                </div>
            </div>
        </div>
    );
}

export default ManagePermissionPage;