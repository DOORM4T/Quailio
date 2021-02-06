import { Box, Button, Layer } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import useSmallBreakpoint from "../hooks/useSmallBreakpoint"

interface IProps {
  handleClose: () => void
  leftChildren?: React.ReactNode
  rightChildren?: React.ReactNode
  [key: string]: any
}

const SplitOverlay: React.FC<IProps> = (props) => {
  const doColumn = useSmallBreakpoint()

  return (
    <Layer
      {...props}
      style={{
        position: "absolute",
        zIndex: 99,
      }}
      animation="slide"
    >
      {/* Close Button */}
      <Button
        className="close-overlay-button"
        aria-label="Close overlay"
        icon={<Icons.Close />}
        style={{
          position: "absolute",
          top: "1rem",
          right: "2rem",
          zIndex: 100,
        }}
        onClick={props.handleClose}
        hoverIndicator
      />

      {/* Content */}
      <Box
        direction={doColumn ? "column" : "row"}
        elevation={doColumn ? "none" : "xlarge"}
        width="xxlarge"
        height={doColumn ? "100vh" : "large"}
      >
        <Box direction="column" style={{ flex: 1 }}>
          {props.leftChildren}
        </Box>
        <Box direction="column" style={{ flex: 2 }}>
          {props.rightChildren}
        </Box>
      </Box>
    </Layer>
  )
}

export default SplitOverlay
