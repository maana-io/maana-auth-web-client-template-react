// --- External imports
import React from "react";
import ReactDOM from "react-dom";
import { Router } from "react-router-dom";

// Apollo imports
import ApolloClient from "apollo-client";
import { createHttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloProvider } from "react-apollo";
import { setContext } from "apollo-link-context";

// --- Internal imports
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import { App, AuthContextProvider } from "./components";
import { getUserAuthClient } from "./util/Auth";
import UserContext from "./util/UserContext";
import history from "./util/history";

const authClient = getUserAuthClient();

// Client setup
// - allow this service to be a client of a remote service
//
const uri = process.env.REACT_APP_MAANA_ENDPOINT;
console.log("REACT_APP_MAANA_ENDPOINT", uri);

const authLink = setContext((_, { headers }) => {
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      ...UserContext.getAuthHeader()
    }
  };
});

const httpLink = createHttpLink({ uri, fetch });

// Now that subscriptions are managed through RabbitMQ, WebSocket transport is no longer needed
// as it is not production-ready and causes both lost and duplicate events.
const link = authLink.concat(httpLink);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache().restore(window.__APOLLO_STATE__)
});

ReactDOM.render(
  <AuthContextProvider authClient={authClient}>
    <ApolloProvider client={client}>
      <Router history={history}>
        <App />
      </Router>
    </ApolloProvider>
    ,
  </AuthContextProvider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
