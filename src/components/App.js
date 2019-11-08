import { Callback, Home, Login, Logout } from ".";
import { Redirect, Route, Switch, useLocation } from "react-router-dom";

import React from "react";
import { useAuthContext } from "./Auth";

export function App() {
  const location = useLocation();
  const { authClient } = useAuthContext();
  const isActive = authClient.isActive();
  const isAuthenticated = authClient.isAuthenticated();

  return (
    <div>
      {!(isActive && isAuthenticated) ? (
        <Switch>
          {/* special route for auth callback */}
          <Route
            path="/callback"
            render={props => {
              return <Callback {...props} />;
            }}
          />

          {/* if the user has requested login, then log them in */}
          <Route path="/login" render={props => <Login {...props} />} />

          {/* if the user is trying to logout, then log them out */}
          <Route
            path="/logout"
            exact
            render={() => {
              return <Logout />;
            }}
          />

          {/* if the user is not logged in and they've requested something else,
          then log them in */}
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location.pathname }
            }}
          />
        </Switch>
      ) : (
        <Switch>
          {/* Display the home page to the user */}
          <Route path="/" exact render={() => <Home />} />

          {/*
            TODO: Add additional routes here for the different pages the user
              can visit
          */}

          {/* if the user is trying to logout, then log them out */}
          <Route
            path="/logout"
            exact
            render={() => {
              return <Logout />;
            }}
          />

          {/*
            TODO: Add a listener to authClient.onInactivityListeners to display
              a warning dialog when the user is about to be automatically logged
              out of the application.
          */}
        </Switch>
      )}
    </div>
  );
}
