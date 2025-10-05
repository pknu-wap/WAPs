import { useState } from "react";
import Header from "../components/Header";
import Menu from "../components/Menu";
import FloatingButton from "../components/FloatingButton";

const TeamBuildPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  return (
    <>
      <Header toggleMenu={toggleMenu} />
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <FloatingButton />
    </>
  );
}

export default TeamBuildPage;
