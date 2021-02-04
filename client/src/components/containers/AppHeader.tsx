import { Anchor, Box, Heading, Image, Text } from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useHistory } from "react-router-dom"
import Spinner from "react-spinner"
import "react-spinner/react-spinner.css"
import Logo from "../../assets/logo.png"
import { HEADER_HEIGHT } from "../../constants"
import { auth } from "../../firebase"
import useAuth from "../../hooks/auth/useAuth"
import { logout } from "../../store/auth/authActions"
import { IApplicationState } from "../../store/store"
import Header from "../Header"

interface IProps {
  title: string
}

const AppHeader: React.FC<IProps> = (props) => {
  const { isAuthenticated: isLoggedIn } = useAuth()
  const dispatch: Dispatch<any> = useDispatch()
  const history = useHistory()

  const isLoading = useSelector<IApplicationState>(
    (state) =>
      state.auth.isLoading || state.networks.isLoading || state.ui.isLoading,
  ) as boolean

  const logoutFunction = async () => {
    try {
      await dispatch(logout())
      history.push("/")
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Header
      title={props.title}
      height={HEADER_HEIGHT}
      menuItems={MenuItems({ isLoggedIn, logoutFunction })}
      children={
        <React.Fragment>
          <Link to="/">
            <Image
              src={Logo}
              style={{ width: "50px" }}
              margin={{ top: "xsmall" }}
            />
          </Link>
          <Heading level={2} margin={{ left: "xsmall" }}>
            {props.title}
          </Heading>
          <Box pad={{ top: "medium" }}>{isLoading && <Spinner />}</Box>
        </React.Fragment>
      }
    />
  )
}

export default AppHeader

// -== MENU  ==- //
interface IMenuProps {
  isLoggedIn: boolean | undefined
  logoutFunction: () => void
}

function MenuItems(props: IMenuProps) {
  const labels: { label: JSX.Element }[] = [
    {
      label: (
        <Link to="/" style={{ display: "inline-block", width: "100%" }}>
          <Box fill pad="small" direction="row">
            <Text margin={{ right: "small" }}>
              <Icons.Home color="accent-1" />
            </Text>
            <Text color="light-1">Home</Text>
          </Box>
        </Link>
      ),
    },
  ]

  /* show user auth pages */
  if (props.isLoggedIn) {
    labels.push({
      label: (
        <Link
          to="/dashboard"
          style={{ display: "inline-block", width: "100%" }}
        >
          <Box fill pad="small" direction="row">
            <Text margin={{ right: "small" }}>
              <Icons.Dashboard color="accent-1" />
            </Text>
            <Text color="light-1">Dashboard</Text>
          </Box>
        </Link>
      ),
    })

    labels.push({
      label: (
        <Link
          to="/settings"
          id="settings-anchor"
          style={{ display: "inline-block", width: "100%" }}
        >
          <Box fill pad="small" direction="row">
            <Text margin={{ right: "small" }}>
              <Icons.UserSettings color="accent-1" />
            </Text>
            <Text color="light-1">Settings</Text>
          </Box>
        </Link>
      ),
    })

    labels.push({
      label: (
        <Box margin={{ left: "auto" }} direction="row">
          {auth.currentUser && (
            <Box direction="column" align="center">
              <Text size="small">Logged in as: {auth.currentUser.email}</Text>
              <Anchor
                id="logout-anchor"
                color="light-1"
                size="small"
                onClick={props.logoutFunction}
              >
                Sign out
              </Anchor>
            </Box>
          )}
        </Box>
      ),
    })
  } else {
    /* otherwise, show register & login links */
    labels.push({
      label: (
        <Link
          to="/login"
          id="login-anchor"
          style={{ display: "inline-block", width: "100%" }}
        >
          <Box fill pad="small" direction="row">
            <Text margin={{ right: "small" }}>
              <Icons.User color="accent-1" />
            </Text>
            <Text color="light-1">Sign in</Text>
          </Box>
        </Link>
      ),
    })

    labels.push({
      label: (
        <Link to="/register" style={{ display: "inline-block", width: "100%" }}>
          <Box fill pad="small" direction="row">
            <Text margin={{ right: "small" }}>
              <Icons.UserNew color="accent-1" />
            </Text>
            <Text color="light-1">Register</Text>
          </Box>
        </Link>
      ),
    })
  }

  return labels
}
