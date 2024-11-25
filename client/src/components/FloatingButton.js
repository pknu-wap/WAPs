import React from "react";
import { useNavigate } from "react-router-dom";

const FloatingButton = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // 이전 페이지로 이동
  };

  return (
    <button
      onClick={handleGoBack}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "#02FF2E",
        color: "#ffffff",
        border: "none",
        borderRadius: "50%",
        width: "60px",
        height: "60px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        fontWeight: "bold",
      }}
    >
      ←
    </button>
  );
};

export default FloatingButton;
