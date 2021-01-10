import React from "react"
import { BrowserRouter as Router, Route, Switch } from "react-router-dom"

import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import SettingsPage from "./pages/SettingsPage"

const Routes: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/settings" component={SettingsPage} />
      </Switch>
    </Router>
  )
}

export default Routes
