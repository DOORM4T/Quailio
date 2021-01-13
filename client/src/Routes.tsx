import React from "react"
import {
  BrowserRouter as Router,
  Route,
  Switch,
  useHistory,
  Redirect,
} from "react-router-dom"

import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import SettingsPage from "./pages/SettingsPage"
import useAuthChange from "./hooks/auth/useAuthChange"

const Routes: React.FC = () => {
  const { isAuthenticated } = useAuthChange()

  return (
    <Router>
      {/* <h1>Status: {String(isAuthenticated)}</h1> */}
      <Switch>
        <Route exact path="/" component={HomePage} />

        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/settings" component={SettingsPage} />

        <Redirect to="/" />
      </Switch>
    </Router>
  )
}

export default Routes
