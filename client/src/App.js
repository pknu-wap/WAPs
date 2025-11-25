import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProjectPage from "./pages/ProjectPage";
import Login from "./pages/Login";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import SplashPage from "./pages/SplashPage";
import Callback from "./components/Login/Callback";
import ProtectedPage from "./components/Login/ProtectedPage";
import VotePage from "./pages/VotePage";
import ProjectCreatePage from "./pages/ProjectCreatePage";
import ScrollToTop from "./components/ScrollToTop";
import VoteResultPage from "./pages/VoteResultPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import TeamBuildPage from "./pages/TeamBuildPage";
import TeamBuildResultPage from "./pages/TeamBuildResultPage";
import CalendarPage from "./pages/CalendarPage";
import AdminRoute from "./components/Login/PrivateRoute";

// 관리자 페이지 
import ManagePermissionPage from "./pages/adminPages/ManagePermissionPage";
import ManagePlanPage from "./pages/adminPages/ManagePlanPage"
import ManageTeamBuildPage from "./pages/adminPages/ManageTeamBuildPage";
import ManageVotePage from "./pages/adminPages/ManageVotePage";
import MainLayout from "./components/MainLayout";

// 레이아웃 컴포넌트들
import AdminPageLayout from "./components/Admin/AdminPageLayout";
import FullScreenLayout from "./components/FullScreenLayout";
import "./App.css";

function App() {
  return (
    <Router>
      <ScrollToTop /> {/* 페이지 전환 시 스크롤 위치 초기화 */}
      <Routes>
        {/* 400px 폭 레이아웃 */}
        <Route element={<MainLayout />}>
          {/* 기본 홈 화면 */}
          <Route path="/" element={<SplashPage />} />
          {/* 로그인 화면 */}
          <Route path="/login" element={<Login />} />
          {/* 카카오 인증 Callback */}
          <Route path="/oauth/callback" element={<Callback />} />
          {/* 경로 */}
          <Route path="/project/create" element={<ProjectCreatePage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/vote/result" element={<VoteResultPage />} />
          <Route path="/vote/result/:semesterParam" element={<VoteResultPage />} />
          <Route path="/ProjectPage" element={<ProjectPage />} />
          <Route path="/project/:projectId" element={<ProjectDetailPage />} />
          <Route path="/project/edit/:projectId" element={<ProjectCreatePage />} />
          <Route path="/select/role" element={<RoleSelectPage />} />
          <Route path="/team-build" element={<TeamBuildPage />} />
          <Route path="/team-build/result" element={<TeamBuildResultPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          {/* 보호된 페이지 */}
          <Route path="/protected" element={<ProtectedPage />} />
        </Route>

        {/* 전체화면 레이아웃 */}
        <Route element={<FullScreenLayout />}>
          {/* 관리자 페이지 */}
          <Route
            path="admin/*"
            element={<AdminRoute requireRole="ROLE_ADMIN" />}
          >
            <Route element={<AdminPageLayout />}>
              <Route path="vote" element={<ManageVotePage />} />
              <Route path="teambuild" element={<ManageTeamBuildPage />} />
              <Route path="permission" element={<ManagePermissionPage />} />
              <Route path="plan" element={<ManagePlanPage />} />
            </Route>
          </Route>

        </Route>
      </Routes>
    </Router >
  );
}

export default App;
