import React from "react";
import { Link } from "react-router-dom";
import "../../assets/Map/Room.css";

const Room308 = () => {
  return (
    <>
    <div className="room-container">
      <div className="booths">
        <div className="door2"></div>
          <Link to="/project/1" className="booth1">WAPs</Link>
          <Link to="/project/cano" className="booth2">홀짝</Link>
          <Link to="/project/5" className="booth3">독도의 기억</Link>
          <Link to="/project/pland" className="booth4">WAPOR</Link>
      </div>
    </div>
    </>
  );
};

export default Room308;
