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
import PrivateRoute from "./components/Login/PrivateRoute"; // PrivateRoute 추가
import Callback from "./components/Login/Callback"; // Callback 추가
import "./App.css";

function App() {
  return (
    <>
      <body>
        <div className="container">
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login/*" element={<Login />} />

              {/* 로그인 콜백 경로 추가 */}
              <Route path="/oauth/callback" element={<Callback />} />

              {/* 보호된 경로 */}
              <Route element={<PrivateRoute />}>
                <Route path="/CreatePage" element={<CreatePage />} />
                <Route path="/vote" element={<Vote />} />
                <Route path="/MyPage" element={<MyPage />} />
              </Route>

              <Route path="/project" element={<Project />} />
              <Route path="/map" element={<Map />} />
              <Route path="/MainPage" element={<MainPage />} />
              <Route path="/project/:projectId" element={<ProjectDetailPage />} />
              <Route path="/app" element={<AppPage />} />
            </Routes>
          </Router>
        </div>
      </body>
    </>
  );
}

export default App;
