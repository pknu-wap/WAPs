import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../../utils/auth";

const PrivateRoute = () => {
  const [authenticated, setAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setAuthenticated(auth);
    };
    checkAuth();
  }, []);

  return authenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
