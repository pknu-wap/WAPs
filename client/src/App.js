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

          {/* 카카오 로그인 콜백 */}
          <Route path="/oauth/callback" element={<Callback />} />

          {/* 경로 */}
          <Route path="/CreatePage" element={<CreatePage />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/MyPage" element={<MyPage />} />

          {/* 프로젝트 관련 경로 */}
          <Route path="/HomePage" element={<Home />} />
          <Route path="/project" element={<Project />} />
          <Route path="/map" element={<Map />} />
          <Route path="/project/:projectId" element={<ProjectDetailPage />} />
          <Route path="/app" element={<AppPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
