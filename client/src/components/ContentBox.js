import React from 'react';
import { useNavigate } from 'react-router-dom';
import cat from '../assets/img/cat.png';

const ContentBox = () => {
  const navigate = useNavigate();

  return (
    <div className="content-box">
      <div className="box" onClick={() => navigate("/web")}>
        <div className="image">
          <img className="project1" alt="project1" src={cat} /> // 테스트(나중에 백에서 받아오기)
        </div>
        <div className="titlebox">
          <h2>프젝 1</h2>
          <p>어떠어떠한 웹사이트</p>
        </div>
      </div>
      <div className="box" onClick={() => navigate("/app")}>
       <div className="titlebox">
        <h2>프젝 1</h2>
        <p>어떠어떠한 웹사이트</p>
       </div>
      </div>
      <div className="box" onClick={() => navigate("/web")}>
       <div className="titlebox">
        <h2>프젝 1</h2>
        <p>어떠어떠한 웹사이트</p>
       </div>
      </div>
      <div className="box" onClick={() => navigate("/app")}>
       <div className="titlebox">
        <h2>프젝 1</h2>
        <p>어떠어떠한 웹사이트</p>
       </div>
      </div>
    </div>
    
  );
};

export default ContentBox;
