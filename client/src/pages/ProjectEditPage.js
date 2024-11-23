import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Menu from "../components/Menu";
import ProjectEditForm from "../components/ProjectEdit/ProjectEditForm";
import App from "../App.css";

const ProjectEditPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="container">
      <Header toggleMenu={toggleMenu} />
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <main>
        <ProjectEditForm />
      </main>
    </div>
  );
};

export default ProjectEditPage;
