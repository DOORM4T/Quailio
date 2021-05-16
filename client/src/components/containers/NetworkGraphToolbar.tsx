import { Box, DropProps } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import useSmallBreakpoint from "../../hooks/useSmallBreakpoint"
import { IApplicationState } from "../../store/store"
import { setToolbarAction } from "../../store/ui/uiActions"
import { ToolbarAction } from "../../store/ui/uiTypes"
import ToolTipButton from "../ToolTipButton"

const dropProps: DropProps = { align: { right: "left" } }
const NetworkGraphToolbar: React.FC = () => {
  const dispatch = useDispatch()
  const isSmall = useSmallBreakpoint()

  const currentAction = useSelector(
    (state: IApplicationState) => state.ui.toolbarAction,
  )

  const setAction = (toolbarAction: ToolbarAction) => () => {
    dispatch(setToolbarAction(toolbarAction))
  }

  const accentIfSelected = (action: ToolbarAction) =>
    currentAction === action ? "accent-1" : "light-1"

  return (
    <Box
      direction={isSmall ? "row" : "column"}
      width="48px"
      pad="1rem"
      align="center"
      justify="start"
    >
      <ToolTipButton
        tooltip="View"
        icon={<Icons.View color={accentIfSelected("VIEW")} />}
        dropProps={dropProps}
        onClick={setAction("VIEW")}
      />
      <ToolTipButton
        tooltip="Select"
        icon={<Icons.Select color={accentIfSelected("SELECT")} />}
        dropProps={dropProps}
        onClick={setAction("SELECT")}
      />

      <ToolTipButton
        tooltip="Create"
        icon={<Icons.AddCircle color={accentIfSelected("CREATE")} />}
        dropProps={dropProps}
        onClick={setAction("CREATE")}
      />
      <ToolTipButton
        tooltip="Move"
        icon={<Icons.Pan color={accentIfSelected("MOVE")} />}
        dropProps={dropProps}
        onClick={setAction("MOVE")}
      />
      <ToolTipButton
        tooltip="Link"
        icon={<Icons.Connect color={accentIfSelected("LINK")} />}
        dropProps={dropProps}
        onClick={setAction("LINK")}
      />
      <ToolTipButton
        tooltip="Toggle Small Mode"
        icon={<Icons.Contract color={accentIfSelected("SMALL")} />}
        dropProps={dropProps}
        onClick={setAction("SMALL")}
      />
      <ToolTipButton
        tooltip="Resize"
        icon={<Icons.Expand color={accentIfSelected("RESIZE")} />}
        dropProps={dropProps}
        onClick={setAction("RESIZE")}
      />
      <ToolTipButton
        tooltip="Pin/Unpin"
        icon={<Icons.Pin color={accentIfSelected("PIN")} />}
        dropProps={dropProps}
        onClick={setAction("PIN")}
      />
    </Box>
  )
}

export default NetworkGraphToolbar
