import "./index.css";

import * as serviceWorker from "./serviceWorker";

import { App, AuthContextProvider } from "./components";

import React from "react";
import ReactDOM from "react-dom";
import { Router } from "react-router-dom";
import { getUserAuthClient } from "./util/Auth";
import history from "./util/history";

const authClient = getUserAuthClient();

ReactDOM.render(
  <AuthContextProvider authClient={authClient}>
    <Router history={history}>
      <App />
    </Router>
  </AuthContextProvider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
