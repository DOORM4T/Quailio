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
import { auth } from "./firebase/services"
import useAuth from "./hooks/auth/useAuth"
import useAuthChange from "./hooks/auth/useAuthChange"
import DashboardPage from "./pages/DashboardPage"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import SettingsPage from "./pages/SettingsPage"
import VerifyAccountPage from "./pages/VerifyAccountPage"

export enum routeNames {
  HOME = "/",
  LOGIN = "/login",
  REGISTER = "/register",
  SETTINGS = "/settings",
  DASHBOARD = "/dashboard",
}

const Routes: React.FC = () => {
  useAuthChange()
  const { isAuthenticated } = useAuth()
  const history = useHistory()

  // If the user is logged in, their email should be verified before using Quailio
  const canContinue =
    auth.currentUser?.emailVerified === undefined ||
    auth.currentUser.emailVerified === true

  if (!canContinue) {
    return <VerifyAccountPage />
  }

  const isDashboard = history.location.pathname.includes(
    routeNames.DASHBOARD.valueOf(),
  )

  return (
    <React.Fragment>
      {/* Hide the default AppHeader on the Dashboard -- the Dashboard page uses
      its own custom header */}
      {!isDashboard && (
        <AppHeader
          title="Quailio"
          children={
            <span style={{ marginTop: "16px", color: "#00C781" }}>beta</span>
          }
        />
      )}
      <TransitionGroup>
        <CSSTransition
          key={history.location.key}
          timeout={500}
          classNames="animate"
        >
          {/* Routes */}
          <Switch>
            <Route exact path={routeNames.HOME} component={HomePage} />

            {/* Log in/Register Routes. Shows Dashboard if authenticated. */}
            <Route path={routeNames.LOGIN}>
              {!isAuthenticated ? (
                <LoginPage />
              ) : (
                <Redirect to={routeNames.DASHBOARD} />
              )}
            </Route>
            <Route path={routeNames.REGISTER}>
              {!isAuthenticated ? (
                <RegisterPage />
              ) : (
                <Redirect to={routeNames.DASHBOARD} />
              )}
            </Route>

            {/* Dashboard Route */}
            <Route path={routeNames.DASHBOARD}>
              <DashboardPage />
            </Route>

            {/* Settings Route. Redirects to Home Page if not authenticated. */}
            <Route path={routeNames.SETTINGS}>
              {isAuthenticated ? (
                <SettingsPage />
              ) : (
                <Redirect to={routeNames.HOME} />
              )}
            </Route>
            <Redirect to={routeNames.HOME} />
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
