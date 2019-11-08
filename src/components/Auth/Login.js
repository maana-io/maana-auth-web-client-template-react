import React, { useEffect } from "react";

import { useAuthContext } from "./AuthContext";
import { useLocation } from "react-router-dom";

export function Login() {
  const location = useLocation();
  const { authClient } = useAuthContext();

  useEffect(() => {
    const startingUrl = location && location.state ? location.state.from : "/";
    authClient.login(startingUrl);
  }, [authClient, location]);

  return <div />;
}
