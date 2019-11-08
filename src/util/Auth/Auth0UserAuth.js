import Auth0Lock from "auth0-lock";
import BaseUserAuth from "./BaseUserAuth";
import UserContext from "../../util/UserContext";
import history from "../../util/history";

export default class Auth0UserAuth extends BaseUserAuth {
  onInactivityListeners = [];
  onLogoutListeners = [];

  constructor(client, container) {
    super(client);

    const audience =
      process.env.AUTH_AUDIENCE || process.env.REACT_APP_PORTAL_AUTH_IDENTIFIER;

    this.auth0 = new Auth0Lock(
      process.env.REACT_APP_PORTAL_AUTH_CLIENT_ID,
      process.env.REACT_APP_PORTAL_AUTH_DOMAIN,
      {
        container,
        avatar: null,
        theme: {
          logo: process.env.PUBLIC_URL + "/logo192.png",
          primaryColor: "#2195f3"
        },
        autoClose: true,
        closable: false,
        rememberLastLogin: false,
        languageDictionary: {
          title: "Maana Knowledge Portal"
        },
        auth: {
          redirectUrl: this.buildRedirectURI(),
          responseType: "token id_token",
          audience,
          params: {
            scope: "openid profile email"
          }
        }
      }
    )
      .on("authenticated", this.handleAuthenticated)
      .on("authorization_error", this.handleError);
  }
  login(startingUrl) {
    super.login(startingUrl);
    this.auth0.show();
  }

  logout() {
    super.logout();
    history.push("/login");
  }

  setSession(authResult) {
    // Set the time that the access token will expire at
    let expiresAt = String(authResult.expiresIn * 1000 + Date.now());
    return super.setSession(
      expiresAt,
      authResult.accessToken,
      authResult.idToken
    );
  }

  renewToken() {
    if (this.promise) return this.promise;

    this.promise = new Promise((resolve, reject) => {
      this.auth0.checkSession({}, (err, result) => {
        if (err) {
          this.promise = null;
          this.logout();
        } else {
          this.setSession(result);
          this.promise = null;
          resolve();
        }
      });
    });

    return this.promise;
  }

  handleAuthenticated = authResult => {
    if (authResult && authResult.accessToken && authResult.idToken) {
      this.addVisibilityCheck();
      this.onActivity();
      this.setSession(authResult);
      this.getProfile((err, profile) => {
        if (profile) {
          this.setUserData(profile);
        } else if (err) {
          this.handleError(err);
          history.replace("/");
        }
      });
    }
  };

  getProfile(cb) {
    let accessToken = UserContext.getAccessToken();
    this.auth0.getUserInfo(accessToken, (err, profile) => {
      cb(err, profile);
    });
  }
}
