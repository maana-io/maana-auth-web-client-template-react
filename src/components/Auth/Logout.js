import React, { useEffect } from "react";

import { useAuthContext } from ".";

export function Logout() {
  const { authClient } = useAuthContext();
  useEffect(() => {
    authClient.logout();
  });

  return <div />;
}
