import { Box, Button, Layer, ResponsiveContext } from "grommet"
import * as Icons from "grommet-icons"
import React, { useContext } from "react"

interface IProps {
  handleClose: () => void
  leftChildren?: React.ReactNode
  rightChildren?: React.ReactNode
}

const SplitOverlay: React.FC<IProps> = (props) => {
  const size = useContext(ResponsiveContext)
  const doColumn = /(small\b|\bmedium\b)/.test(size) /* xsmall, small, medium */

  return (
    <Layer
      style={{
        position: "absolute",
        zIndex: 99,
      }}
    >
      <Box
        direction={doColumn ? "column" : "row"}
        background="light-1"
        elevation="xlarge"
        pad="small"
        gap="small"
        width="xlarge"
        height="large"
      >
        <Button
          aria-label="Close menu"
          icon={<Icons.Close />}
          style={{ position: "absolute", top: 0, right: 0, zIndex: 100 }}
          onClick={props.handleClose}
          hoverIndicator
        />
        <Box
          direction="column"
          width="medium"
          fill
          justify="center"
          style={{ flex: 1 }}
        >
          {props.leftChildren}
        </Box>
        <Box
          direction="column"
          width="medium"
          fill
          justify="center"
          style={{ flex: 2 }}
          pad={{ top: "large" }}
        >
          {props.rightChildren}
        </Box>
      </Box>
    </Layer>
  )
}

export default SplitOverlay
