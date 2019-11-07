import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Link, BrowserRouter as Router } from 'react-router-dom'
import './index.css'
import * as serviceWorker from './serviceWorker'
import Login from './Auth/Login'
import { getUserAuthClient } from './Auth'

const userAuth = getUserAuthClient()
const isActive = userAuth.isActive()
const isAuthenticated = userAuth.isAuthenticated()

if (!(isActive && isAuthenticated)) {
  ReactDOM.render(<Login />, document.getElementById('root'))
} else {
  const routing = (
    <Router>
      <div>
        <ul>
          <li>
            <Link to="/logout">Logout</Link>
          </li>
        </ul>
        <Route
          path="/logout"
          exact
          render={() => {
            userAuth.logout()
            return null
          }}
        />
      </div>
      <div>
        <h1>Congats, you've been autenticated!</h1>
      </div>
    </Router>
  )
  ReactDOM.render(routing, document.getElementById('root'))
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
