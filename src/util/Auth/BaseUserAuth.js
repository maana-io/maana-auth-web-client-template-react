import UserContext, { THEME_DEFAULT } from "../../util/UserContext";

import history from "../../util/history";

export const RENEW_TOKEN_TIMER_OFFSET = 60000; // 1 minute
const CHECK_ACTIVITY_TIMER = 60000; // 1 minute
const SHOW_INACTIVITY_DIALOG_TIMER = 300000; // 5 minutes
const INACTIVITY_TIMER =
  (window.MAANA_ENV && window.MAANA_ENV.INACTIVITY_TIMER) || 3600000; // 1 hour

const DISPLAY_INACTIVITY_TIMER =
  INACTIVITY_TIMER - SHOW_INACTIVITY_DIALOG_TIMER;

const USER_AUTH_ERROR_MESSAGE = "An issue happened during authentication";
const DEFAULT_USER_ICON = "/icons/user.svg";

export default class BaseUserAuth {
  onInactivityListeners = [];
  onLogoutListeners = [];
  onTokenChangeListeners = [];

  constructor() {
    this.promise = null;

    if (this.isAuthenticated()) {
      if (this.isActive()) {
        this.onActivity();
        this.scheduleRenewal();
        this.addVisibilityCheck();
      } else {
        this.logout();
      }
    }
  }

  /**
   * Checks to see if the user has recently been active.
   *
   * @returns {boolean} True of the user is active, false if the user has not been active
   */
  isActive() {
    // if the inactivity timer is zero or lower, then this feature is disabled
    if (INACTIVITY_TIMER <= 0) return true;

    // check to see if the users has been active
    let lastActivity = UserContext.getUserActivity();
    return (
      lastActivity &&
      Date.now() - parseInt(lastActivity, 10) <= INACTIVITY_TIMER
    );
  }

  /**
   * Checks to see if there is a valid user token available
   */
  isAuthenticated() {
    let expiresAt = parseInt(UserContext.getIdTokenExipiry(), 10);
    const isAuth = Date.now() + RENEW_TOKEN_TIMER_OFFSET < expiresAt;
    return isAuth;
  }

  /**
   * Starts the login process for the user
   *
   * Note:  Child classes need to have their own version of this function
   *
   * @param {string} startingUrl The URL that the browser started at before login was initiated.
   */
  login(startingUrl) {
    UserContext.setStartingUrl(startingUrl);
  }

  /**
   * Will get a new authentication token for the user in the background for the
   * user, and will log the user out if there is an error that required them to
   * go through the normal sign-in process again.
   *
   * Note:  Child classes need to have their own version of this function
   */
  renewToken() {}

  /**
   * Error handler used for user authentication
   */
  handleError = err => {
    console.error(USER_AUTH_ERROR_MESSAGE, err);
    history.replace("/");
  };

  /**
   * Checks to see if the token is still valid, and then updates it if it needs
   * to be renewed
   */
  async checkTokenValidity() {
    if (!this.isAuthenticated()) {
      // make sure to clean up any old token renewal information
      if (this.tokenRenewalTimeout) {
        clearTimeout(this.tokenRenewalTimeout);
        this.tokenRenewalTimeout = null;
      }

      await this.renewToken();
    }
  }

  /**
   * Saves the user authentication information, and token renewal timer.
   *
   * @param {string} expiresAt Time in milliseconds when the token will expire
   * @param {string} accessToken The token used to authenticate the user
   * @param {string} idToken The token containing additional information about the user
   */
  setSession(expiresAt, accessToken, idToken) {
    UserContext.setAccessToken(accessToken);
    UserContext.setIdToken(idToken);
    UserContext.setIdTokenExpiry(expiresAt);

    // schedule a token renewal
    this.scheduleRenewal();

    // notify the token change listeners
    this.onTokenChangeListeners.forEach(l =>
      l({ token: accessToken, expiresAt })
    );
  }

  /**
   * Adds a new listener for when the token changes.
   *
   * @param {Function} listener A function that is listening for auth updates
   */
  addTokenChangeListener(listener) {
    if (listener && !this.onTokenChangeListeners.includes(listener)) {
      this.onTokenChangeListeners.push(listener);
    }
  }

  /**
   * Removes a specified listener function, or all listener functions if one is
   * not specified.
   *
   * @param {Function} listener The listener function to remove
   */
  removeTokenChangeListener(listener) {
    if (listener) {
      this.onTokenChangeListeners = this.onTokenChangeListeners.filter(
        l => l !== listener
      );
    } else {
      this.onTokenChangeListeners = [];
    }
  }

  /**
   * Sets the users profile data in local store, and on the servers if needed.
   *
   * @param {Object} profile The users profile data
   */
  setUserData(profile) {
    // set a default user icon if it was not pulled from the auth provider
    if (!profile.picture) {
      profile.picture = DEFAULT_USER_ICON;
    }

    const redirect = UserContext.getStartingUrl() || "/";
    UserContext.setStartingUrl("/");

    UserContext.setUserProfile(profile);
    const { email } = profile;
    UserContext.setUserId(email);
    UserContext.setTheme(THEME_DEFAULT);
    history.replace(redirect);
  }

  /**
   * Adds a check to see if the authentication token needs to renewed when the
   * browser tab goes from hidden to visible.
   */
  addVisibilityCheck() {
    document.addEventListener(
      "visibilitychange",
      this.checkTokenOnVisibilityChange
    );
  }

  /**
   * Removes the visibility check for authentication token renewal
   */
  removeVisibilityCheck() {
    document.removeEventListener(
      "visibilitychange",
      this.checkTokenOnVisibilityChange
    );
  }

  /**
   * Checks to see if the authentication token needs to be renewed when the
   * document is visibile.
   */
  checkTokenOnVisibilityChange = () => {
    if (!document.hidden) {
      this.checkTokenValidity();
    }
  };

  /**
   * Sets a timeout to renew the users authentication token
   */
  scheduleRenewal() {
    const storedData = UserContext.getIdTokenExipiry();
    if (storedData) {
      const expiresAt = parseInt(storedData, 10);
      const delay = expiresAt - Date.now() - RENEW_TOKEN_TIMER_OFFSET;
      if (delay > 0) {
        this.tokenRenewalTimeout = setTimeout(() => {
          this.tokenRenewalTimeout = null;
          this.renewToken();
        }, delay);
      }
    }
  }

  /**
   * Logs the user out of the application
   */
  logout() {
    UserContext.clear();
    this.removeVisibilityCheck();

    if (this.activityCheckTimeout) {
      clearTimeout(this.activityCheckTimeout);
      this.activityCheckTimeout = null;
    } else {
      window.removeEventListener("click", this.onActivity);
      window.removeEventListener("keypress", this.onActivity);
    }

    if (this.inactivityDisplayTimeout) {
      clearTimeout(this.inactivityDisplayTimeout);
      this.inactivityDisplayTimeout = null;
    }

    if (this.tokenRenewalTimeout) {
      clearTimeout(this.tokenRenewalTimeout);
      this.tokenRenewalTimeout = null;
    }

    // let our listeners know that the user is being logged out
    this.onLogoutListeners.forEach(f => f());

    return;
  }

  /**
   * Builds the redirect URI used by the different auth providers to return to
   * out application with the authentication information
   */
  buildRedirectURI() {
    return `${window.location.origin}/callback`;
  }

  /**
   * Starts timers to check for user activity, so that they can be auto-logged
   * out when they walk away from their computer for too long
   */
  startCheckingForActivity() {
    this.activityCheckTimeout = setTimeout(() => {
      this.activityCheckTimeout = null;
      window.addEventListener("click", this.onActivity);
      window.addEventListener("keypress", this.onActivity);
    }, CHECK_ACTIVITY_TIMER);

    this.inactivityDisplayTimeout = setTimeout(() => {
      this.inactivityDisplayTimeout = null;

      // before actually showing the dialog we should check to make sure that
      // activity is not happening in another window.  We do not bother
      // restarting this timer for displaying inactivity, as we should be able
      // to expect the active window to handle that.
      let lastActivity = UserContext.getUserActivity();
      if (
        !lastActivity ||
        Date.now() - lastActivity >= DISPLAY_INACTIVITY_TIMER
      ) {
        this.onInactivityListeners.forEach(f =>
          f(SHOW_INACTIVITY_DIALOG_TIMER)
        );
      }
    }, DISPLAY_INACTIVITY_TIMER);
  }

  /**
   * Updates the auto-logout timers when there is user activity with the
   * application.  It listens for click and keypress activity on the window
   * object to check for user activity.
   */
  onActivity = () => {
    if (INACTIVITY_TIMER > 0) {
      window.removeEventListener("click", this.onActivity);
      window.removeEventListener("keypress", this.onActivity);
      UserContext.setUserActivity(Date.now());

      if (this.inactivityDisplayTimeout) {
        clearTimeout(this.inactivityDisplayTimeout);
        this.inactivityDisplayTimeout = null;
      }

      this.startCheckingForActivity();
    }
  };
}
