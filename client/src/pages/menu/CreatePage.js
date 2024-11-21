import React, { useState } from "react";
import ProjectForm from "../../components/ProjectCreation/ProjectForm";
import Header from "../../components/Header";
import Menu from "../../components/Menu";

const CreatePage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div>
      <Header toggleMenu={toggleMenu} />
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <main>
        <ProjectForm />
      </main>
    </div>
  );
};

export default CreatePage;
