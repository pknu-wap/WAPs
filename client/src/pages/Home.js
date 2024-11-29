import React, { useState } from "react";
import Header from "../components/Header";
import Menu from "../components/Menu";
import ContentBox from "../components/ContentBox";
import FloatingButton from "../components/FloatingButton";

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div>
      <Header menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <main>
        <ContentBox />
      </main>
      {/* <FloatingButton /> */}
    </div>
  );
};

export default Home;
