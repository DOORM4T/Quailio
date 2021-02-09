import React from "react"
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
  useHistory,
} from "react-router-dom"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import AppHeader from "./components/containers/AppHeader"
import useAuthChange from "./hooks/auth/useAuthChange"
import DashboardPage from "./pages/DashboardPage"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import SettingsPage from "./pages/SettingsPage"

const Routes: React.FC = () => {
  const history = useHistory()
  const { isAuthenticated } = useAuthChange()

  if (isAuthenticated === undefined) return <div />

  return (
    <React.Fragment>
      <AppHeader title="Quailio" />
      <TransitionGroup>
        <CSSTransition
          key={history.location.key}
          timeout={500}
          classNames="animate"
        >
          <Switch>
            <Route exact path="/" component={HomePage} />

            {/* Log in/Register Routes. Shows Dashboard if authenticated. */}
            <Route path="/login">
              {!isAuthenticated ? <LoginPage /> : <Redirect to="/dashboard" />}
            </Route>
            <Route path="/register">
              {!isAuthenticated ? (
                <RegisterPage />
              ) : (
                <Redirect to="/dashboard" />
              )}
            </Route>

            {/* Dashboard Route. Redirects to Home Page if not authenticated. */}
            <Route path="/dashboard">
              {isAuthenticated ? <DashboardPage /> : <Redirect to="/" />}
            </Route>

            {/* Settings Route. Redirects to Home Page if not authenticated. */}
            <Route path="/settings">
              {isAuthenticated ? <SettingsPage /> : <Redirect to="/" />}
            </Route>
            <Redirect to="/" />
          </Switch>
        </CSSTransition>
      </TransitionGroup>
    </React.Fragment>
  )
}

const RoutesWrap: React.FC = () => {
  return (
    <Router>
      <Route component={Routes} />
    </Router>
  )
}

export default RoutesWrap
