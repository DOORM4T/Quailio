import { Box, Button, Layer, ResponsiveContext } from "grommet"
import * as Icons from "grommet-icons"
import React, { useContext } from "react"

interface IProps {
  handleClose: () => void
  leftChildren?: React.ReactNode
  rightChildren?: React.ReactNode
  [key: string]: any
}

const SplitOverlay: React.FC<IProps> = (props) => {
  const size = useContext(ResponsiveContext)
  const doColumn = /(small\b)/.test(size) /* xsmall, small, medium */

  return (
    <Layer
      {...props}
      style={{
        position: "absolute",
        zIndex: 99,
      }}
    >
      {/* Close Button */}
      <Button
        aria-label="Close menu"
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
        background="light-1"
        elevation={doColumn ? "none" : "xlarge"}
        pad="small"
        gap="small"
        width="xlarge"
        height={doColumn ? "100vh" : "large"}
      >
        <Box
          direction="column"
          style={{ flex: 1 }}
          fill
          height={doColumn ? "40%" : "100%"}
          overflow={doColumn ? "auto" : "hidden"}
        >
          {props.leftChildren}
        </Box>
        <Box
          direction="column"
          style={{ flex: doColumn ? 1 : 2 }}
          fill
          height={doColumn ? "40%" : "100%"}
          overflow={doColumn ? "auto" : "hidden"}
        >
          {props.rightChildren}
        </Box>
      </Box>
    </Layer>
  )
}

export default SplitOverlay
