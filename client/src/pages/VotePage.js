import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Menu from "../components/Menu";
import VoteForm from "../components/Vote/VoteForm";
import FloatingButton from "../components/FloatingButton";
import Cookies from "js-cookie";

// 분기를 결정함.
// 현재 투표 기간인지에 따라 분기 구별함.
const VotePage = () => {
  const currentYear = new Date().getFullYear(); // 현재 연도 가져오기
  // 분기를 결정하는 api 임.
  const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/vote/now`;

  // 토큰 받아오기
  const token = Cookies.get("authToken");
  const [menuOpen, setMenuOpen] = useState(false);

  // 현재 투표기간인지 판단하는 함수
  const [isOpen, setIsOpen] = useState(false);

  // 투표했는지 여부의 초기값은 일단 false
  const [isvotedUser, setIsVotedUser] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const validate = async () => {
      // 토큰 여부 확인
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }
      // 토큰 만료 여부 확인
      try {
        await axios.get(`${process.env.REACT_APP_API_BASE_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        alert("로그인 유효기간이 만료되었습니다. 재로그인 해주세요.");
        navigate("/login");
        return;
      }

      // 토큰이 유효하면 그다음 투표 기간 확인
      try {
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setIsOpen(response.data.isOpen);
        setIsVotedUser(response.data.isvotedUser);
      } catch (error) {
        alert("투표 기간인지 확인할 수 없습니다.");
      }
    };

    validate();
  }, [navigate, apiUrl, token]);

  return (
    <div className="container">
      <Header toggleMenu={toggleMenu} />

      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <main>
        {/* <VoteForm isVotedUser={isvotedUser} /> */}
        {isOpen ? <VoteForm isVotedUser={isvotedUser} /> : navigate("/vote/result")}
      </main>
      <FloatingButton />
    </div>
  );
};

export default VotePage;
