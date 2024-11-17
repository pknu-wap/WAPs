import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Login from './Login'; // Login 컴포넌트 임포트
import Callback from './Callback';

const KakaoLogin = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/oauth/callback" element={<Callback />} />
      </Routes>
    </div>
  );
};

export default KakaoLogin;
