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
import { auth } from "./firebase"
import {
  getAllNetworks,
  setNetworkLoading,
} from "./store/networks/networksActions"
import { useDispatch } from "react-redux"
import { ActionCreator, AnyAction } from "redux"
import { setAuthLoading, setUser } from "./store/auth/authActions"

const Routes: React.FC = () => {
  const dispatch: ActionCreator<AnyAction> = useDispatch()

  React.useEffect(() => {
    /* set user credentials in global state */
    auth.onAuthStateChanged(async (user) => {
      const id = user ? user.uid : null
      try {
        await dispatch(setUser(id))
      } catch (error) {
        await dispatch(setNetworkLoading(false))
      }
    })
  }, [])

  return (
    <Router>
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
