import React from "react";
import { Link } from "react-router-dom";
import "../../assets/Map/Room.css";

const Room306 = () => {
  return (
    <>
    <div className="room-container">
      <div className="booths">
        <div className="door2"></div>
          <Link to="/project/hooked-free" className="booth1">AromaPlayer</Link>
          <Link to="/project/cano" className="booth2" >GAN-Z</Link>
          <Link to="/project/8" className="booth3">WABI</Link>
          <Link to="/project/pland" className="booth4">북플레이리스트</Link>
      </div>
    </div>
    </>
  );
};

export default Room306;
