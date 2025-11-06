import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/menu/Login";
import Project from "./pages/menu/Project";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import SplashPage from "./pages/SplashPage";
import Callback from "./components/Login/Callback";
import ProtectedPage from "./components/Login/ProtectedPage";
import VotePage from "./pages/VotePage";
import ProjectPage from "./pages/ProjectPage";
import ScrollToTop from "./components/ScrollToTop";
import VoteResultPage from "./pages/VoteResultPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import TeamBuildPage from "./pages/menu/TeamBuildPage";
import TeamBuildResultPage from "./pages/TeamBuildResultPage";

import "./App.css";

function App() {
  return (
    <Router>
      <ScrollToTop /> {/* 페이지 전환 시 스크롤 위치 초기화 */}
      <div className="container">
        <Routes>
          {/* 기본 홈 화면 */}
          <Route path="/" element={<SplashPage />} />
          {/* 로그인 화면 */}
          <Route path="/login" element={<Login />} />
          {/* 카카오 인증 Callback */}
          <Route path="/oauth/callback" element={<Callback />} />
          {/* 경로 */}
          <Route path="/project/create" element={<ProjectPage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/result" element={<VoteResultPage />} />
          <Route path="/HomePage" element={<Home />} />
          <Route path="/project" element={<Project />} />
          <Route path="/project/:projectId" element={<ProjectDetailPage />} />
          <Route path="/project/edit/:projectId" element={<ProjectPage />} />
          <Route path="/select/role" element={<RoleSelectPage />} />
          <Route path="/team-build" element={<TeamBuildPage />} />
          <Route path="/team-build/result" element={<TeamBuildResultPage />} />
          {/* 보호된 페이지 */}
          <Route path="/protected" element={<ProtectedPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
