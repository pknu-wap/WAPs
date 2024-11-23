import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/menu/Login";
import Project from "./pages/menu/Project";
import CreatePage from "./pages/menu/CreatePage";
import Vote from "./pages/menu/Vote";
import Map from "./pages/menu/Map";
import MyPage from "./pages/menu/MyPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import AppPage from "./pages/project/AppPage";
import MainPage from "./pages/MainPage";
import Callback from "./components/Login/Callback";
import ProtectedPage from "./components/Login/ProtectedPage";
import VotePage from "./pages/VotePage";
import ProjectEditPage from "./pages/ProjectEditPage";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="container">
        <Routes>
          {/* 기본 홈 화면 */}
          <Route path="/" element={<MainPage />} />

          {/* 로그인 화면 */}
          <Route path="/login" element={<Login />} />

          {/* 카카오 인증 Callback */}
          <Route path="/oauth/callback" element={<Callback />} />

          {/* 경로 */}
          <Route path="/CreatePage" element={<CreatePage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/MyPage" element={<MyPage />} />
          <Route path="/HomePage" element={<Home />} />
          <Route path="/project" element={<Project />} />
          <Route path="/map" element={<Map />} />
          <Route path="/project/:projectId" element={<ProjectDetailPage />} />
          <Route
            path="/project/edit/:projectId"
            element={<ProjectEditPage />}
          />
          <Route path="/app" element={<AppPage />} />

          {/* 보호된 페이지 */}
          <Route path="/protected" element={<ProtectedPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
