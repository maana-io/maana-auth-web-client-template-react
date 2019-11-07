import React, { useState } from 'react'

import UserContext from 'util/UserContext'

function buildDefaultAuthContext() {
  return {
    token: UserContext.getAccessToken(),
    expiresAt: UserContext.getIdTokenExipiry()
  }
}

/**
 * The React Context for the Authentication information
 */
export const AuthContext = React.createContext(null)

/**
 * The provider used to set the updated Authentication information in the
 * context.
 */
export function AuthContextProvider({ children, authClient }) {
  const [authContext, setAuthContext] = useState(buildDefaultAuthContext())
  authClient.addTokenChangeListener(setAuthContext)

  return (
    <AuthContext.Provider
      value={{
        ...authContext,
        authHeader: UserContext.getAuthHeader()
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Passes the Authentication information down it is children.
 *
 * @param {function} children A function that renders the children.
 */
export function AuthContextConsumer({ children }) {
  return <AuthContext.Consumer>{children}</AuthContext.Consumer>
}
