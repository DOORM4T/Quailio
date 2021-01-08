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
      <Link to="/">
        <Text margin={{ right: "small" }}>
          <Icons.Home color="accent-1" />
        </Text>
        <Text color="light-1">Home</Text>
      </Link>
    ),
  },
  {
    label: (
      <Link to="/dashboard">
        <Text margin={{ right: "small" }}>
          <Icons.Dashboard color="accent-1" />
        </Text>
        <Text color="light-1">Dashboard</Text>
      </Link>
    ),
  },
]

const Header: React.FC<IProps> = (props) => {
  const size = React.useContext(ResponsiveContext)
  const isSmall = size === "xsmall" || size === "small"

  return (
    <GrommetHeader
      background="brand"
      pad={{ horizontal: "large" }}
      justify="start"
    >
      <Heading level={3}>{props.title}</Heading>
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
