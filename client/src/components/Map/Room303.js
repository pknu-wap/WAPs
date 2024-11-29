import React from "react";
import { Link } from "react-router-dom";
import "../../assets/Map/Room.css";

const Room303 = () => {
  return (
    <>
    <div className="room-container">
      <div className="booths">
          <Link to="/project/2" className="booth1">Hooked & Free</Link>
          <Link to="/project/cano" className="booth2">CANO</Link>
          <Link to="/project/12" className="booth3">The Exiled Knight</Link>
          <Link to="/project/pland" className="booth4">플랜드</Link>
      </div>
    </div>
    <div className="door1"></div>
    </>
  );
};

export default Room303;
