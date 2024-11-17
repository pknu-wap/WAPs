// utils/auth.js
export const isAuthenticated = () => !!localStorage.getItem('token');
