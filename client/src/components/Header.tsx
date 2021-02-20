import { Box, Header as GrommetHeader, Menu, Nav } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"

interface IProps {
  menuItems: { label: JSX.Element }[]
  title?: string
  children?: React.ReactNode
  height?: number
}

// -== HEADER ==- //
const Header: React.FC<IProps> = (props) => {
  return (
    <GrommetHeader
      background="brand"
      pad={{ left: "small", right: "small" }}
      justify="start"
      align="center"
      height={{ min: `${props.height}px`, max: `${props.height}px` }}
    >
      {props.children}
      <Nav margin={{ left: "auto" }} direction="row" pad="xsmall">
        <Menu
          id="navigation-menu"
          icon={<Icons.Menu />}
          items={props.menuItems}
          dropAlign={{ top: "bottom", right: "left" }}
          size="large"
        />
      </Nav>
    </GrommetHeader>
  )
}

Header.defaultProps = {
  title: "Header Title",
  height: 60,
}

export default Header
