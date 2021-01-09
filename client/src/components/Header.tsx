import React from "react"
import {
  ResponsiveContext,
  Header as GrommetHeader,
  Box,
  Menu,
  Nav,
  Heading,
  Text,
} from "grommet"
import * as Icons from "grommet-icons"
import { Link } from "react-router-dom"

interface IProps {
  title?: string
}

const MenuItems = [
  {
    label: (
      <Box fill>
        <Link to="/">
          <Text margin={{ right: "small" }}>
            <Icons.Home color="accent-1" />
          </Text>
          <Text color="light-1">Home</Text>
        </Link>
      </Box>
    ),
  },
  {
    label: (
      <Box fill>
        <Link to="/dashboard">
          <Text margin={{ right: "small" }}>
            <Icons.Dashboard color="accent-1" />
          </Text>
          <Text color="light-1">Dashboard</Text>
        </Link>
      </Box>
    ),
  },
]

export const HEADER_HEIGHT = 60

const Header: React.FC<IProps> = (props) => {
  const size = React.useContext(ResponsiveContext)
  const isSmall = size === "xsmall" || size === "small"

  return (
    <GrommetHeader
      background="brand"
      pad={{ horizontal: "large" }}
      justify="start"
      height={{ min: `${HEADER_HEIGHT}px`, max: `${HEADER_HEIGHT}px` }}
    >
      <Heading level={2}>{props.title}</Heading>
      <Nav margin={{ left: "auto" }} direction="row" pad="xsmall">
        {
          // ==- SMALL SCREENS -== //
          // show dropdown menu
          isSmall && (
            <Menu
              icon={<Icons.Menu />}
              items={MenuItems}
              dropAlign={{ top: "bottom", right: "left" }}
              size="large"
            />
          )
        }
        {
          // ==- MEDIUM+ SCREENS -== //
          // show all nav links
          !isSmall && (
            <Box direction="row" gap="small">
              <Link to="/">
                <Icons.Home color="accent-1" />
              </Link>

              <Link to="/dashboard">
                <Icons.Dashboard color="accent-1" />
              </Link>
            </Box>
          )
        }
      </Nav>
    </GrommetHeader>
  )
}

Header.defaultProps = {
  title: "App",
}

export default Header
