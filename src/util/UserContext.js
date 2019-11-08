// Constants specific to authentication and user context
const ACCESS_TOKEN_STORAGE_NAME = "access_token";
const ID_TOKEN_STORAGE_NAME = "id_token";
const EXPIRES_AT_STORAGE_NAME = "expires_at";
const USER_ID_STORAGE_NAME = "user_id";
const USER_PROFILE_STORAGE_NAME = "user_profile";
const THEME_STORAGE_NAME = "theme";
const ACTIVITY_STORAGE_NAME = "useractivity";
const LINK_SUBSCRIPTION_STORAGE_NAME = "subscribeToLinks";
const VERIFIER_STORAGE_NAME = "verifier";
const STARTING_URL_NAME = "starting_url";

const THEME_DARK = "DARK";
const THEME_LIGHT = "LIGHT";
export const THEME_DEFAULT = THEME_DARK;

/**
 * Contains user related information such as user id, auth token, profile, theme.
 * Used by the login and logout processes as well as to
 * Currently, most of this information is stored in localStorage.
 */
class UserContext {
  getUserId() {
    return localStorage.getItem(USER_ID_STORAGE_NAME);
  }
  setUserId(id) {
    localStorage.setItem(USER_ID_STORAGE_NAME, id);
  }

  getUserProfile() {
    return JSON.parse(localStorage.getItem(USER_PROFILE_STORAGE_NAME));
  }
  setUserProfile(profile) {
    localStorage.setItem(USER_PROFILE_STORAGE_NAME, JSON.stringify(profile));
  }

  getIdToken() {
    return localStorage.getItem(ID_TOKEN_STORAGE_NAME);
  }
  setIdToken(token) {
    localStorage.setItem(ID_TOKEN_STORAGE_NAME, token);
  }

  getIdTokenExipiry() {
    return localStorage.getItem(EXPIRES_AT_STORAGE_NAME);
  }
  setIdTokenExpiry(expiresAt) {
    localStorage.setItem(EXPIRES_AT_STORAGE_NAME, expiresAt);
  }

  getUserActivity() {
    return localStorage.getItem(ACTIVITY_STORAGE_NAME);
  }
  setUserActivity(activity) {
    localStorage.setItem(ACTIVITY_STORAGE_NAME, activity);
  }

  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_NAME);
  }
  setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_NAME, token);
  }

  getVerifier() {
    return localStorage.getItem(VERIFIER_STORAGE_NAME);
  }
  setVerifier(verifier) {
    localStorage.setItem(VERIFIER_STORAGE_NAME, verifier);
  }

  /**
   * Returns an object containing the authorization with bearer token.
   */
  getAuthHeader() {
    const token = this.getAccessToken();
    return {
      authorization: token ? `Bearer ${token}` : ""
    };
  }

  getSubscribeToLinks() {
    return localStorage.getItem(LINK_SUBSCRIPTION_STORAGE_NAME);
  }
  setSubscribeToLinks(val) {
    localStorage.setItem(LINK_SUBSCRIPTION_STORAGE_NAME, val);
  }

  getTheme() {
    return localStorage.getItem(THEME_STORAGE_NAME) || THEME_DEFAULT;
  }
  setTheme(theme) {
    localStorage.setItem(THEME_STORAGE_NAME, theme);
  }
  isDarkTheme() {
    const theme = this.getTheme();
    return theme && theme.toUpperCase() === THEME_DARK.toUpperCase();
  }
  toggleTheme() {
    const newTheme = this.isDarkTheme() ? THEME_LIGHT : THEME_DARK;
    this.setTheme(newTheme);
    return newTheme;
  }

  setStartingUrl(startingUrl) {
    localStorage.setItem(STARTING_URL_NAME, startingUrl);
  }
  getStartingUrl() {
    return localStorage.getItem(STARTING_URL_NAME);
  }

  /**
   * Clears user login and activity information.
   */
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_NAME);
    localStorage.removeItem(ID_TOKEN_STORAGE_NAME);
    localStorage.removeItem(EXPIRES_AT_STORAGE_NAME);
    localStorage.removeItem(USER_ID_STORAGE_NAME);
    localStorage.removeItem(THEME_STORAGE_NAME);
    localStorage.removeItem(ACTIVITY_STORAGE_NAME);
    localStorage.removeItem(STARTING_URL_NAME);
  }
}
export default new UserContext();
