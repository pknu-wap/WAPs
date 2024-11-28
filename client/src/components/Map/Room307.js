import React from "react";
import { Link } from "react-router-dom";
import "../../assets/Map/Room.css";
const Room307 = () => {
  return (
    <>
    <div className="room-container">
      <div className="booths">
          <div className="door2"></div>
          <Link to="/project/hooked-free" className="booth1">VALAGA</Link>
          <Link to="/project/cano" className="booth2">이세계파이터</Link>
          <Link to="/project/6" className="booth3">OverClean</Link>
          <Link to="/project/pland" className="booth4">THe dawn of the fall</Link>
      </div>
    </div>
    </>
  );
};

export default Room307;
