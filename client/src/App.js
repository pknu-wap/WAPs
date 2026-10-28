import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProjectPage from "./pages/ProjectPage";
import Login from "./pages/Login";
import LoginDev from "./pages/LoginDev";
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
import TeamBuildApplyPage from "./pages/TeamBuildApplyPage";
import TeamBuildEntryPage from "./pages/TeamBuildEntryPage";
import TeamBuildResultPage from "./pages/TeamBuildResultPage";
import CalendarPage from "./pages/CalendarPage";
import AdminRoute from "./components/Login/PrivateRoute";
import Settings from "./pages/Settings";

import ManagePermissionPage from "./pages/adminPages/ManagePermissionPage";
import ManagePlanPage from "./pages/adminPages/ManagePlanPage";
import ManageTeamBuildPage from "./pages/adminPages/ManageTeamBuildPage";
import ManageThirdTeamBuildPage from "./pages/adminPages/ManageThirdTeamBuildPage";
import ManageVotePage from "./pages/adminPages/ManageVotePage";
import MainLayout from "./components/MainLayout";

import AdminPageLayout from "./components/Admin/AdminPageLayout";
import FullScreenLayout from "./components/FullScreenLayout";
import "./App.css";

function App() {
  useEffect(() => {
    const setScreenSize = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setScreenSize();
    window.addEventListener("resize", setScreenSize);

    return () => window.removeEventListener("resize", setScreenSize);
  }, []);
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<SplashPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-dev" element={<LoginDev />} />
          <Route path="/oauth/callback" element={<Callback />} />
          <Route path="/project/create" element={<ProjectCreatePage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/vote/result" element={<VoteResultPage />} />
          <Route
            path="/vote/result/:semesterParam"
            element={<VoteResultPage />}
          />
          <Route path="/ProjectPage" element={<ProjectPage />} />
          <Route path="/project/:projectId" element={<ProjectDetailPage />} />
          <Route
            path="/project/edit/:projectId"
            element={<ProjectCreatePage />}
          />
          <Route path="/select/role" element={<RoleSelectPage />} />
          <Route path="/team-build" element={<TeamBuildEntryPage />} />
          <Route
            path="/team-build/projects"
            element={<TeamBuildApplyPage key="first" round={1} />}
          />
          <Route
            path="/team-build/projects/2nd"
            element={<TeamBuildApplyPage key="second" round={2} />}
          />
          <Route
            path="/team-build/recruit"
            element={<TeamBuildPage key="recruit-first" round={1} />}
          />
          <Route
            path="/team-build/recruit/2nd"
            element={<TeamBuildPage key="recruit-second" round={2} />}
          />
          <Route path="/team-build/result" element={<TeamBuildResultPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/protected" element={<ProtectedPage />} />
        </Route>

        <Route element={<FullScreenLayout />}>
          <Route
            path="admin/*"
            element={<AdminRoute requireRole="ROLE_ADMIN" />}
          >
            <Route element={<AdminPageLayout />}>
              <Route index element={<Navigate to="vote" replace />}></Route>
              <Route path="vote" element={<ManageVotePage />} />
              <Route path="teambuild" element={<ManageTeamBuildPage />} />
              <Route
                path="teambuild/3rd"
                element={<ManageThirdTeamBuildPage />}
              />
              <Route path="permission" element={<ManagePermissionPage />} />
              <Route path="plan" element={<ManagePlanPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
