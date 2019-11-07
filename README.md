# Maana-Auth-Web-Client-Template (React)

Bare bones React app with unified auth0/keycloak authentication.

## Functionality

User must login in order to see 'protected' page.
Once user is authenticated, they can logout.
Once logout is clicked, the user will be immediately redirected to login.

## Env variables that must be set

These must be set for the web app to communicate with the auth provider.

- REACT_APP_AUTH_PROVIDER=
- REACT_APP_AUTH_AUDIENCE=
- REACT_APP_PORTAL_AUTH_IDENTIFIER=
- REACT_APP_PORTAL_AUTH_CLIENT_ID=
- REACT_APP_PORTAL_AUTH_DOMAIN=
