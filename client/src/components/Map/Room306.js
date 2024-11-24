import React from "react";
import { Link } from "react-router-dom";
import "../../assets/Map/Room.css";

const Room306 = () => {
  return (
    <div className="room-container">
      <h2>306호</h2>
      <div className="booths">
        <Link to="/project/hooked-free" className="booth">Hooked & Free</Link>
        <Link to="/project/cano" className="booth">CANO</Link>
        <Link to="/project/exiled-knight" className="booth">The Exiled Knight</Link>
        <Link to="/project/pland" className="booth">플랜드</Link>
      </div>
    </div>
  );
};

export default Room306;
