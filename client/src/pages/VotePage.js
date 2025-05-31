import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Menu from "../components/Menu";
import VoteForm from "../components/Vote/VoteForm";
import FloatingButton from "../components/FloatingButton";
import Cookies from "js-cookie";

import VoteResultPage from "./VoteResultPage";

// 분기를 결정함.
// 현재 투표 기간인지에 따라 분기 구별함.
const VotePage = () => {
  const currentYear = new Date().getFullYear(); // 현재 연도 가져오기
  // 분기를 결정하는 api 임.
  const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/vote/now?semester=1&projectYear=${currentYear}`;
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
    // 허용된 시간 설정 (2024년 11월 29일 오후 6시)
    // const allowedDate = new Date("2024-11-29T18:00:00");
    // const now = new Date();

    // if (now < allowedDate) {
    //   // 아직 허용되지 않은 시간인 경우
    //   alert("투표는 2024년 11월 29일 오후 6시부터 가능합니다.");
    //   navigate(-1); // 이전 페이지로 이동
    // }

    // 엑세스 토큰 만료여부 확인

    const checkToken = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/user/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (error) {
        alert("로그인 유효기간이 만료되었습니다. 재로그인 해주세요.");
      }
    };

    checkToken();

    if (!token) {
      // 토큰이 없는 경우
      alert("로그인이 필요합니다.");
      navigate("/login"); // 로그인 페이지로 이
    }

    // 현재 투표 기간임을 판단하기 위함
    const isInVotingPeriod = async () => {
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 가져온 데이터 표시
        // console.log("프로젝트 상세 정보:", response.data);
        // console.log("가져온 데이터", response.data);

        // 받은 boolean 값을 set으로 설정해줌.
        setIsOpen(response.data.open);
        setIsVotedUser(response.data.votedUser);
        // console.log(isOpen);
      } catch (error) {
        alert("투표 기간인지 확인할 수 없습니다. ");
      } finally {
        // setIsLoading(false);
      }
    };

    isInVotingPeriod();
  }, [navigate, apiUrl, token]);
  return (
    <div className="container">
      <Header toggleMenu={toggleMenu} />

      <Menu menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <main>
        {/* 이게 내가 사용해야할 코드임!! 지금 백엔드가 안되어있어서 임시방편으로
        아래방법 선택함. */}
        {/* {isOpen ? <VoteForm /> : <VoteResultPage />} */}
        {isOpen ? <VoteForm isVotedUser={isvotedUser} /> : <VoteResultPage />}
      </main>
      <FloatingButton />
    </div>
  );
};

export default VotePage;
