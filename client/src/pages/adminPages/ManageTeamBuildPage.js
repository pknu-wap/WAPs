import { useState, useEffect } from 'react';
import styles from '../../assets/Admin/ManageTeamBuild.module.css';
import { adminTeamBuildApi } from '../../api/admin';
import useSemester from '../../hooks/useSemester';
import { IconCheck } from '../../components/Admin/icons';

const ManageTeamBuildPage = () => {
    const [loading, setLoading] = useState(false); // 로딩 중 여부
    const [status, setStatus] = useState('OPEN'); // 현재 팀빌딩 상태
    const [statusLoading, setStatusLoading] = useState(true); // 팀빌딩 상태 로드 여부 (api 배포 이후엔 true로 변경하기!!!)
    const [statusChanging, setStatusChanging] = useState(false); // 상태 변경 중 여부(버튼 중복 클릭 방지)
    const semester = useSemester();

    // 상태별 단계 정보
    const statusSteps = [
        { key: 'OPEN', label: '시작' },
        { key: 'APPLY', label: '지원' },
        { key: 'RECRUIT', label: '모집' },
        { key: 'CLOSED', label: '끝' },
    ];

    const fetchStatus = async () => {
        try {
            const res = await adminTeamBuildApi.getTeamBuildStatus();
            setStatus(res.status);
            setStatusLoading(false);
        } catch (e) {
            alert('팀빌딩 상태 조회에 실패했습니다.');
            setStatus('unavailable');
        } finally {
            setStatusLoading(false);
        }
    }

    // 상태 조회 (최초)
    useEffect(() => {
        fetchStatus();
    }, [semester]);

    // 팀빌딩 시작 (open)
    const handleOpenTeamBuild = async () => {
        setStatusChanging(true);
        try {
            await adminTeamBuildApi.createTeamBuild(); // 팀빌딩 시작
            setStatus('OPEN');
        } catch (e) {
            alert('팀빌딩 시작에 실패했습니다.');
        }
        setStatusChanging(false);
    };

    // 상태 변경 (다음 단계로)
    const handleChangeStatus = async () => {
        if (status === 'CLOSED') return;
        setStatusChanging(true);
        try {
            // 현재 상태의 인덱스를 찾음
            const currentIdx = statusSteps.findIndex(s => s.key === status);
            // 다음 단계의 키를 가져옴 
            const nextStatus = statusSteps[currentIdx + 1]?.key;

            if (!nextStatus) {
                alert('더 이상 변경할 상태가 없습니다.');
                return;
            }

            await adminTeamBuildApi.updateTeamBuildStatus(semester, nextStatus); // 상태 변경
            setStatus(nextStatus); // 성공 시 상태 업데이트
            await fetchStatus();
        } catch (e) {
            console.error(e);
            alert('상태 변경에 실패했습니다.');
        } finally {
            setStatusChanging(false);
        }
    };

    // 상태가 END일 때만 알고리즘 실행 가능
    const canRunAlgorithm = status === 'CLOSED';

    // 팀 빌딩 알고리즘 실행 (CLOSED 상태에서만)
    const handleRunTeamBuilding = async () => {
        if (!canRunAlgorithm) return;  // 실행 가능 상태가 아니면 아무것도 하지 않음
        if (!window.confirm('정말 팀 빌딩 알고리즘을 실행하시겠습니까?')) return;
        setLoading(true);
        try {
            await adminTeamBuildApi.runTeamBuilding();
            alert('팀 빌딩 알고리즘이 성공적으로 실행되었습니다!');
        } catch (e) {
            alert('팀 빌딩 알고리즘 실행에 실패했습니다.');
        }
        setLoading(false);
    };

    // CSV 다운로드 함수
    const handleDownload = async (type) => {
        setLoading(true);
        try {
            let res;
            if (type === 'applies') {
                res = await adminTeamBuildApi.getApplies();
            } else {
                res = await adminTeamBuildApi.getRecruits();
            }

            const data = res.data || res;
            const blob = new Blob(['\uFEFF', data], { type: 'text/csv;charset=utf-8;' });

            // 파일 다운로드 처리 
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', type === 'applies' ? '지원현황.csv' : '모집현황.csv');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('CSV 다운로드에 실패했습니다.');
        }
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            {/* 상단 영역 */}
            <div className={styles.upperBox}>
                <div className={styles.stepCard}>
                    <div className={styles.stepper}>
                        {/* 팀빌딩 불가 상태 */}
                        {status === 'unavailable' && (
                            <>
                                {statusSteps.map((step, idx) => (
                                    <>
                                        <div key={step.key} className={styles.step}>
                                            <span>{step.label}</span>
                                            <div className={styles.circle}></div>
                                        </div>
                                        {idx < statusSteps.length - 1 && <div className={styles.line} />}
                                    </>
                                ))}
                                <button
                                    className={styles.nextBtn}
                                    onClick={handleOpenTeamBuild}
                                    disabled={statusChanging}
                                    style={{ background: statusChanging ? '#888' : undefined }}
                                >
                                    팀빌딩 시작하기
                                </button>
                            </>
                        )}
                        {/* 팀빌딩 진행 상태 */}
                        {status !== 'unavailable' && (
                            <>
                                {statusSteps.map((step, idx) => {
                                    const currentIdx = statusSteps.findIndex(s => s.key === status);
                                    const isActive = idx <= currentIdx;

                                    let lineClass = styles.line;
                                    if (idx < currentIdx) {
                                        // 현재 단계보다 이전 라인: 완료됨 (파란색)
                                        lineClass = `${styles.line} ${styles.completedLine}`;
                                    } else if (idx === currentIdx) {
                                        // 현재 단계에서 뻗어나가는 라인: 그라데이션 (파란색 -> 회색)
                                        lineClass = `${styles.line} ${styles.gradientLine}`;
                                    }
                                    return (
                                        <>
                                            <div key={step.key} className={`${styles.step} ${isActive ? styles.active : ''}`}>
                                                <span>{step.label}</span>
                                                <div className={styles.circle}>{isActive ? <IconCheck color={'#000'} size="1" /> : ''}</div>
                                            </div>
                                            {idx < statusSteps.length - 1 && <div className={lineClass} />}
                                        </>
                                    );
                                })}
                                <button
                                    className={styles.nextBtn}
                                    onClick={handleChangeStatus}
                                    disabled={statusChanging || status === 'CLOSED' || statusLoading}
                                    style={{ background: (statusChanging || status === 'CLOSED' || statusLoading) ? '#888' : undefined, fontSize: 33 }}
                                >
                                    →
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 하단 영역 */}
            <div className={styles.underBox}>
                <div className={styles.btnArea}>
                    <div className={styles.csvRow}>
                        <span>지원 CSV</span>
                        <button
                            className={styles.exportBtn}
                            onClick={() => handleDownload('applies')}
                            disabled={loading}
                        >
                            받아오기
                        </button>
                    </div>
                    <div className={styles.csvRow}>
                        <span>모집 CSV</span>
                        <button
                            className={styles.exportBtn}
                            onClick={() => handleDownload('recruits')}
                            disabled={loading}
                        >
                            받아오기
                        </button>
                    </div>
                    <button
                        className={styles.teamBuildBtn}
                        onClick={handleRunTeamBuilding}
                        disabled={loading || !canRunAlgorithm}
                        style={{
                            background: (!canRunAlgorithm || loading) ? '#888' : '#abd4fd',
                            color: (!canRunAlgorithm || loading) ? '#ccc' : '#222',
                            cursor: (!canRunAlgorithm || loading) ? 'not-allowed' : 'pointer',
                        }}
                    >
                        팀 빌딩 알고리즘 실행
                    </button>
                    {(loading || statusLoading) && <div>처리 중...</div>}
                </div>
            </div>
        </div>
    );
};

export default ManageTeamBuildPage;
