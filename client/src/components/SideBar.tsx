import { Button, Sidebar } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"

interface IProps {
  handleClose: () => void
}

const SideBar: React.FC<IProps> = (props) => {
  return (
    <Sidebar
      direction="column"
      background="light-1"
      width="medium"
      elevation="xlarge"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 99,
      }}
    >
      <Button
        aria-label="Close menu"
        icon={<Icons.Close />}
        style={{ position: "absolute", top: 0, right: 0 }}
        onClick={props.handleClose}
        hoverIndicator
      />
      {props.children}
    </Sidebar>
  )
}

export default SideBar
