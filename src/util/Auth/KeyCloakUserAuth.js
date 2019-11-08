import BaseUserAuth, { RENEW_TOKEN_TIMER_OFFSET } from "./BaseUserAuth";

import KeyCloak from "keycloak-js";

export default class KeyCloakUserAuth extends BaseUserAuth {
  constructor() {
    super();
    this.initKeyCloak();
  }

  /**
   * Initializes the KeyCloak library and adds event listeners to it.
   */
  initKeyCloak() {
    if (this.keyCloak) return;

    const audience =
      process.env.AUTH_AUDIENCE || process.env.REACT_APP_PORTAL_AUTH_IDENTIFIER;

    this.keyCloak = KeyCloak({
      url: `${process.env.REACT_APP_PORTAL_AUTH_DOMAIN}/auth`,
      realm: process.env.REACT_APP_PORTAL_AUTH_IDENTIFIER,
      clientId: process.env.REACT_APP_PORTAL_AUTH_CLIENT_ID,
      scope: audience
    });

    this.keyCloak
      .init({
        promiseType: "native",
        flow: "implicit",
        adapter: this.buildAdapter()
      })
      .then(this.handleAuthenticated)
      .catch(this.handleError);
  }

  login(startingUrl) {
    super.login(startingUrl);
    this.keyCloak.login({ redirectUri: this.buildRedirectURI() });
  }

  logout() {
    super.logout();

    // This check is here, as logout can be called by the base class before
    // KeyCloak has had a chance to be initialized.
    this.initKeyCloak();

    this.keyCloak.logout({
      redirectUri: `${window.location.origin}/login`
    });
  }

  isAuthenticated() {
    let isAuthed = super.isAuthenticated();
    try {
      isAuthed =
        isAuthed &&
        this.keyCloak.isTokenExpired(
          RENEW_TOKEN_TIMER_OFFSET + this.keyCloak.timeSkew * 1000
        );
    } catch {}

    return isAuthed;
  }

  setSession() {
    const { tokenParsed, token, idToken } = this.keyCloak;
    // Set the time that the access token will expire at
    let expiresAt = String(tokenParsed.exp * 1000);
    super.setSession(expiresAt, token, idToken);
  }

  renewToken() {
    if (this.promise) return this.promise;

    this.promise = new Promise((resolve, reject) => {
      this.keyCloak.login({
        prompt: "none",
        redirectUri: this.getRenewalRedirectUri(),
        resolve,
        reject
      });
    });

    return this.promise;
  }

  getRenewalRedirectUri() {
    return `${window.location.origin}/silentLogin.html?_=${process.env.SILENT_LOGIN_CACHE_BREAKER}`;
  }

  handleAuthenticated = authResult => {
    if (authResult && this.keyCloak.token && this.keyCloak.idToken) {
      this.addVisibilityCheck();
      this.onActivity();
      this.setSession();
      if (this.keyCloak.idTokenParsed) {
        this.setUserData(this.keyCloak.idTokenParsed);
      }
    }
  };

  goToUrl(url, options) {
    if (options && options.prompt === "none") {
      const iframe = document.createElement("iframe");

      iframe.onload = e => {
        try {
          const params = new URLSearchParams(
            iframe.contentWindow.location.hash.substring(1)
          );

          if (
            params.has("state") &&
            url.includes(params.get("state")) &&
            !params.has("error") &&
            params.has("access_token")
          ) {
            this.setToken(
              params.get("access_token"),
              null,
              params.get("id_token"),
              Date.now()
            );
            this.setSession();

            if (options.resolve) {
              options.resolve();
            }
            this.promise = null;
          } else {
            if (options.reject) {
              options.reject(new Error("Failed to renew auth token"));
            }
            this.promise = null;

            this.logout();
          }
          document.body.removeChild(iframe);
        } catch (e) {
          // When there are CORS issues the browser will throw security errors
          // when accessing the content of the iframe.  At this point the best
          // bet is to just log an error and log the user out.
          console.error(
            "Failed to get updated authentication tokens with error",
            e
          );
          this.logout();
        }
      };
      iframe.setAttribute("src", url);
      iframe.setAttribute("title", "keycloak-session-iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    } else {
      // redirect to the new URL, but make sure another redirect in not already
      // in progress.
      if (!this.isRedirectingToKeyCloakServer) {
        this.isRedirectingToKeyCloakServer = true;
        window.location.replace(url);
      }
    }
  }

  buildAdapter() {
    return {
      login: options => {
        this.goToUrl(this.keyCloak.createLoginUrl(options), options);
        return new Promise(() => false);
      },

      logout: options => {
        this.goToUrl(this.keyCloak.createLogoutUrl(options), options);
        return new Promise(() => false);
      },

      register: options => {
        this.goToUrl(this.keyCloak.createRegisterUrl(options), options);
        return new Promise(() => false);
      },

      accountManagement: () => {
        var accountUrl = this.keyCloak.createAccountUrl();
        if (typeof accountUrl !== "undefined") {
          this.goToUrl(accountUrl);
        } else {
          throw new Error("Not supported by the OIDC server");
        }
        return new Promise(() => false);
      },

      redirectUri: (options, encodeHash) => {
        if (arguments.length === 1) {
          encodeHash = true;
        }

        if (options && options.redirectUri) {
          return options.redirectUri;
        } else if (this.keyCloak.redirectUri) {
          return this.keyCloak.redirectUri;
        } else {
          return window.location.href;
        }
      }
    };
  }

  /**
   * Sets the supplied set of tokens onto the KeyCloak object, and decodes the
   * JWT for additional information where needed.
   *
   * Note:  As these are needed as silent authentication had to be manually
   * implemented for KeyCloak, and KeyCloak does not supply any external way to
   * token the tokens once created.
   *
   * @param {string} token The authentication token
   * @param {string} refreshToken The refresh token
   * @param {string} idToken The ID token
   * @param {int} timeLocal The current time in milliseconds
   */
  setToken(token, refreshToken, idToken, timeLocal) {
    // clear out the token timeout handle, since it is no longer needed
    if (this.keyCloak.tokenTimeoutHandle) {
      clearTimeout(this.keyCloak.tokenTimeoutHandle);
      this.keyCloak.tokenTimeoutHandle = null;
    }

    // handle updating the refresh token
    if (refreshToken) {
      this.keyCloak.refreshToken = refreshToken;
      this.keyCloak.refreshTokenParsed = this.decodeToken(refreshToken);
    } else {
      delete this.keyCloak.refreshToken;
      delete this.keyCloak.refreshTokenParsed;
    }

    // handle updating the ID token
    if (idToken) {
      this.keyCloak.idToken = idToken;
      this.keyCloak.idTokenParsed = this.decodeToken(idToken);
    } else {
      delete this.keyCloak.idToken;
      delete this.keyCloak.idTokenParsed;
    }

    // handle updating the authentication token
    if (token) {
      this.keyCloak.token = token;
      this.keyCloak.tokenParsed = this.decodeToken(token);
      this.keyCloak.sessionId = this.keyCloak.tokenParsed.session_state;
      this.keyCloak.authenticated = true;
      this.keyCloak.subject = this.keyCloak.tokenParsed.sub;
      this.keyCloak.realmAccess = this.keyCloak.tokenParsed.realm_access;
      this.keyCloak.resourceAccess = this.keyCloak.tokenParsed.resource_access;

      if (timeLocal) {
        // The time skew is calculated in seconds, so local time needs to be
        // transformed into seconds.  After that we need subtract the server
        // time from the local time to figure out what the time skew between the
        // two is.
        this.keyCloak.timeSkew =
          Math.floor(timeLocal / 1000) - this.keyCloak.tokenParsed.iat;
      }

      // set KeyCloaks token timeout timer when we have timeSkew and a handler
      // for the event
      if (this.keyCloak.timeSkew != null) {
        if (this.keyCloak.onTokenExpired) {
          // All time values from the KeyCloak server are in seconds.  To
          // calculate the delta to when the token expires you take the time
          // that the token will expire and subtract the current time.  The
          // final value needs to be in milliseconds for the setTimeout call.
          var expiresIn =
            (this.keyCloak.tokenParsed["exp"] -
              new Date().getTime() / 1000 +
              this.keyCloak.timeSkew) *
            1000;
          if (expiresIn <= 0) {
            this.keyCloak.onTokenExpired();
          } else {
            this.keyCloak.tokenTimeoutHandle = setTimeout(
              this.keyCloak.onTokenExpired,
              expiresIn
            );
          }
        }
      }
    } else {
      delete this.keyCloak.token;
      delete this.keyCloak.tokenParsed;
      delete this.keyCloak.subject;
      delete this.keyCloak.realmAccess;
      delete this.keyCloak.resourceAccess;

      this.keyCloak.authenticated = false;
    }
  }

  /**
   * Decodes a JWT token returned from the KeyCloak server.
   *
   * NOTE:  This is code that was pulled out of the KeyCloak JS library so that
   * I could update the tokens after a silent authentication request during a
   * token refresh event.
   *
   * @param {string} str An encoded JWT token to decode
   */
  decodeToken(str) {
    str = str.split(".")[1];

    str = str.replace("/-/g", "+");
    str = str.replace("/_/g", "/");
    switch (str.length % 4) {
      case 0:
        break;
      case 2:
        str += "==";
        break;
      case 3:
        str += "=";
        break;
      default:
        throw new Error("Invalid token");
    }

    str = (str + "===").slice(0, str.length + (str.length % 4));
    str = str.replace(/-/g, "+").replace(/_/g, "/");

    str = decodeURIComponent(escape(atob(str)));

    str = JSON.parse(str);
    return str;
  }
}
