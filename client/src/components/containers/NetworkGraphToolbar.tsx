import { Box } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import useSmallBreakpoint from "../../hooks/useSmallBreakpoint"
import ToolTipButton from "../ToolTipButton"

const NetworkGraphToolbar: React.FC = () => {
  const isSmall = useSmallBreakpoint()

  return (
    <Box
      direction={isSmall ? "row" : "column"}
      width="48px"
      pad="1rem"
      align="center"
      justify="start"
    >
      <ToolTipButton tooltip="Select" icon={<Icons.Select />} />
      <ToolTipButton tooltip="View" icon={<Icons.View />} />
    </Box>
  )
}

export default NetworkGraphToolbar
