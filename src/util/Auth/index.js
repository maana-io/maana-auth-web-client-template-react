import Auth0UserAuth from "./Auth0UserAuth";
import KeyCloakUserAuth from "./KeyCloakUserAuth";

let authClient = null;

/**
 * Returns the user authentication client, and will create it if it has not been
 * created yet.
 */
export function getUserAuthClient() {
  if (!authClient) {
    switch (process.env.REACT_APP_AUTH_PROVIDER) {
      case "keycloak": {
        authClient = new KeyCloakUserAuth();
        break;
      }
      case "auth0":
      default: {
        authClient = new Auth0UserAuth();
        break;
      }
    }
  }
  return authClient;
}
