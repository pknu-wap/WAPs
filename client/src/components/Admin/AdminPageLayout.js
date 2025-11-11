import SideBar from "./SideBar";
// 어드민 페이지 공용 레이아웃

const AdminPageLayout = () => {
    return (
        <div>
            {/* 헤더 */}
            <div>
                여기에 헤더
            </div>

            {/* 메인 */}
            <div>
                <SideBar />
                {/* 메인 컨첸츠가 들어갈 컨테이너 */}
                <div />
            </div>

        </div>
    );
}

export default AdminPageLayout;