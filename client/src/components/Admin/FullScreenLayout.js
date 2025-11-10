import { Outlet } from 'react-router-dom';
import '../../assets/Admin/FullScreenLayout.css'; // 전체 화면용 CSS

const FullScreenLayout = () => {
    return (
        <div className="full-screen-wrapper">
            <Outlet /> {/* 이 레이아웃을 부모로 하는 모든 페이지가 여기에 렌더링됨 */}
        </div>
    );
};

export default FullScreenLayout;