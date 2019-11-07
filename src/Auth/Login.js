import PropTypes from 'prop-types'
import React from 'react'
import { Redirect } from 'react-router-dom'
import { getUserAuthClient } from '.'
import styled from 'styled-components'

const Root = styled.div`
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 0;
  left: 0;

  /* center content (form) in screen */
  display: flex;
  align-items: center;
  justify-content: center;
`

class Login extends React.Component {
  state = {
    redirectToReferrer: false
  }

  handleLogin = user => {
    this.setState({ redirectToReferrer: true })
  }

  render() {
    const { location } = this.props
    const loc = location ? location.state : { from: { pathname: '/' } }
    const { from } = loc || { from: { pathname: '/' } }

    if (this.state.redirectToReferrer) {
      return <Redirect to={from} />
    }

    const startingUrl = location && location.state ? location.state.from : '/'

    console.log('starting url', startingUrl)

    return <Root>{getUserAuthClient().login(startingUrl)}</Root>
  }
}

Login.propTypes = {
  location: PropTypes.object
}

export default Login
