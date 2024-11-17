import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth'; // '../utils/auth'를 '../../utils/auth'로 변경


const PrivateRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
