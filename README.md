# Maana-Auth-Web-Client-Template (React)

Bare bones React app with unified auth0/keycloak authentication.

## Functionality

User must login in order to see 'protected' page.
Once user is authenticated, they can logout.
Once logout is clicked, the user will be immediately redirected to login.

## Prerequisites
- A client must exist on the authentication server that can provide an OAuth 'implicit flow'.
- There must be a registered redirect URL on the client configured on the authetication server (see 'Understanding OAuth Implicity Flow and Redirect URL security' section).

## Env variables that must be set

These must be set for the web app to communicate with the auth provider. (Auth provodier will always be set to either 'auth0' or 'keycloak')

- REACT_APP_AUTH_PROVIDER=
- REACT_APP_AUTH_AUDIENCE=
- REACT_APP_PORTAL_AUTH_IDENTIFIER=
- REACT_APP_PORTAL_AUTH_CLIENT_ID=
- REACT_APP_PORTAL_AUTH_DOMAIN=

An example for keycloak:

- REACT_APP_AUTH_PROVIDER=keycloak
- REACT_APP_AUTH_AUDIENCE=(The audience on your JWT)
- REACT_APP_PORTAL_AUTH_IDENTIFIER=(This is your 'realm' name)
- REACT_APP_PORTAL_AUTH_CLIENT_ID=(Client name)
- REACT_APP_PORTAL_AUTH_DOMAIN=(Key cloak url, usually ending in your port number)

## Understanding OAuth Implicit Flow and Redirect URL security

In order for OAuth implicit flow to be secure, the redirect URL given to the auth
provider during login (where the token will be sent back to) MUST be registered with that auth provider ahead of time. If it is not, it should consider the request invalid and not return the token.

This is important to note here--this app will not be able to login unless your auth0 or keycloak client has this app's URL added to its list of valid redirect URLs. If you're managing keycloak or auth0 in house, you will need to configure this yourself, otherwise will need to contact the entity managing your auth, and have them add the redirect URL. Please research this, as there are many ways to provide greater flexibility or rigidity around the URLs.
