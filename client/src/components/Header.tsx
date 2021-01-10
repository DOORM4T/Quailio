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
import { useDispatch } from "react-redux"
import { ThunkDispatch } from "redux-thunk"
import { logout } from "../store/auth/authActions"

export const HEADER_HEIGHT = 60

// -== HEADER ==- //
const Header: React.FC<IProps> = (props) => {
  const dispatch: LogoutDispatch = useDispatch()
  const history = useHistory()

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
      <Nav direction="row" pad="xsmall" margin={{ left: "auto" }}>
        <Menu
          icon={<Icons.Menu />}
          items={MenuItems({ logoutFunction })}
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
  logoutFunction: () => void
}

function MenuItems(props: IMenuProps) {
  return [
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
    {
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
    },
    {
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
    },
    {
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
    },
  ]
}
