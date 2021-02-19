import { Anchor, Box, Text } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { Link } from "react-router-dom"
import { auth } from "../../firebase/firebase"

// -== MENU  ==- //
interface IMenuProps {
  isLoggedIn: boolean | undefined
  logoutFunction: () => void
}
export function MenuItems(props: IMenuProps) {
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
