import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Menu from "../components/Menu";
import VoteForm from "../components/Vote/VoteForm";
import FloatingButton from "../components/FloatingButton";
import Cookies from "js-cookie";

const VotePage = () => {
  const token = Cookies.get("authToken");
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    // 허용된 시간 설정 (2024년 11월 29일 오후 6시)
    const allowedDate = new Date("2024-11-29T18:00:00");
    const now = new Date();

    if (now < allowedDate) {
      // 아직 허용되지 않은 시간인 경우
      alert("투표는 2024년 11월 29일 오후 6시부터 가능합니다.");
      navigate(-1); // 이전 페이지로 이동
    }

    if (!token) {
      // 토큰이 없는 경우
      alert("로그인이 필요합니다.");
      navigate("/login"); // 로그인 페이지로 이
    }
  }, [navigate]);

  return (
    <div className="container">
      <Header toggleMenu={toggleMenu} />
      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <main>
        <VoteForm />
      </main>
      <FloatingButton />
    </div>
  );
};

export default VotePage;
