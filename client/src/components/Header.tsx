import React from "react"
import {
  ResponsiveContext,
  Header as GrommetHeader,
  Box,
  Menu,
  Nav,
  Heading,
  Text,
  Button,
  Anchor,
} from "grommet"
import * as Icons from "grommet-icons"
import { Link, useHistory } from "react-router-dom"
import { auth } from "../firebase"
import { IAuthLogoutAction, IAuthState } from "../store/auth/authTypes"
import { useDispatch, useSelector } from "react-redux"
import { ThunkDispatch } from "redux-thunk"
import { logout } from "../store/auth/authActions"
import { IApplicationState } from "../store/store"

import Spinner from "react-spinner"
import "react-spinner/react-spinner.css"

export const HEADER_HEIGHT = 60

// -== HEADER ==- //
const Header: React.FC<IProps> = (props) => {
  const dispatch: LogoutDispatch = useDispatch()
  const history = useHistory()

  const isLoggedIn: boolean = auth.currentUser ? true : false

  const isLoading = useSelector<IApplicationState>(
    (state) => state.auth.isLoading || state.networks.isLoading,
  ) as boolean
  console.log(isLoading)

  const logoutFunction = () => {
    try {
      dispatch(logout())
      history.push("/")
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <GrommetHeader
      background="brand"
      pad={{ left: "large", right: "small" }}
      justify="start"
      height={{ min: `${HEADER_HEIGHT}px`, max: `${HEADER_HEIGHT}px` }}
    >
      <Heading level={2}>{props.title}</Heading>
      <Box margin={{ left: "auto", top: "medium" }}>
        {isLoading && <Spinner />}
      </Box>
      <Nav direction="row" pad="xsmall">
        <Menu
          icon={<Icons.Menu />}
          items={MenuItems({ logoutFunction, isLoggedIn })}
          dropAlign={{ top: "bottom", right: "left" }}
          size="large"
        />
      </Nav>
    </GrommetHeader>
  )
}

Header.defaultProps = {
  title: "App",
}

export default Header

type LogoutDispatch = ThunkDispatch<IAuthState, null, IAuthLogoutAction>
interface IProps {
  title?: string
}

// -== MENU  ==- //
interface IMenuProps {
  isLoggedIn: boolean
  logoutFunction: () => void
}

function MenuItems(props: IMenuProps) {
  const labels: object[] = [
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
        <Link to="/settings" style={{ display: "inline-block", width: "100%" }}>
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
              <Text size="small">Logged in as: ${auth.currentUser.email}</Text>
              <Anchor
                color="light-1"
                size="small"
                onClick={props.logoutFunction}
              >
                Log out
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
        <Link to="/login" style={{ display: "inline-block", width: "100%" }}>
          <Box fill pad="small" direction="row">
            <Text margin={{ right: "small" }}>
              <Icons.User color="accent-1" />
            </Text>
            <Text color="light-1">Log in</Text>
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
