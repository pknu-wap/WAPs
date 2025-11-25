import React from 'react';
import wapsLogo from "../assets/img/waps_logo.png";
import "../assets/LoadingPage.css";

function LoadingPage() {
  return (
    <div className="loadingpage">
      <div className="mb-6">
        <img
          src={wapsLogo}
          alt="WAPs"
          className="waplogo"
          onClick={() => navigate("/ProjectPage")}
          style={{ cursor: "pointer", height: "50px" }} // 크기 조절
        />
      </div>
      <p className="text">Loading...</p>
    </div>
  );
}

export default LoadingPage;
