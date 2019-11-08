import { Callback, Home, Login } from ".";
import { Redirect, Route, Switch, useLocation } from "react-router-dom";

import React from "react";
import { getUserAuthClient } from "../util/Auth";

export function App() {
  const location = useLocation();
  const userAuth = getUserAuthClient();
  const isActive = userAuth.isActive();
  const isAuthenticated = userAuth.isAuthenticated();

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
              userAuth.logout();
              return null;
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
          <Route path="/" exact render={() => <Home />} />
          <Route
            path="/logout"
            exact
            render={() => {
              userAuth.logout();
              return null;
            }}
          />
        </Switch>
      )}
    </div>
  );
}
