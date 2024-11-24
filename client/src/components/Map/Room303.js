import React from "react";
import { Link } from "react-router-dom";
import "../../assets/Map/Room.css";

const Room303 = () => {
  return (
    <>
    <div className="room-container">
      <div className="booths">
        <div className="booth1">
          <Link to="/project/hooked-free">Hooked & Free</Link>
        </div>
        <div className="booth2">
          <Link to="/project/cano">CANO</Link>
        </div>
        <div className="booth3">
          <Link to="/project/exiled-knight">The Exiled Knight</Link>
        </div>
        <div className="booth4">
          <Link to="/project/pland">플랜드</Link>
        </div>
      </div>
    </div>
    <div className="door1"></div>
    </>
  );
};

export default Room303;
