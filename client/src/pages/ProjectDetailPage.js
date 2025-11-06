import React, { useState } from "react";
import Header from "../components/Header";
import Menu from "../components/Menu";
import ProjectDetailForm from "../components/ProjectDetail/ProjectDetailForm";
import FloatingButton from "../components/FloatingButton";

const ProjectDetailPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="container">
      <Header toggleMenu={toggleMenu} />
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <main>
        <ProjectDetailForm />
      </main>
      <FloatingButton />
    </div>
  );
};

export default ProjectDetailPage;
