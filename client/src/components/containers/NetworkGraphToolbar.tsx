import { Box, DropProps } from "grommet"
import * as Icons from "grommet-icons"
import React, { FC } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fireFitCanvasEvent } from "../../helpers/customEvents"
import useSmallBreakpoint from "../../hooks/useSmallBreakpoint"
import { IApplicationState } from "../../store/store"
import { setSmallMode, setToolbarAction } from "../../store/ui/uiActions"
import { ToolbarAction } from "../../store/ui/uiTypes"
import ToolTipButton from "../ToolTipButton"

interface IProps {
  isViewingShared: boolean
}

const dropProps: DropProps = { align: { right: "left" } }
const NetworkGraphToolbar: React.FC<IProps> = ({ isViewingShared }) => {
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

  const isSmallMode = useSelector(
    (state: IApplicationState) => state.ui.isSmallMode,
  )

  const toggleSmallMode = () => {
    dispatch(setSmallMode(!isSmallMode))
  }
  const toggleSmallModeButton = (
    <ToolTipButton
      tooltip={`${isSmallMode ? "Exit simple view" : "Enter simple view"}`}
      icon={
        isSmallMode ? (
          <Icons.EmptyCircle color="accent-2" />
        ) : (
          <Icons.Image color="accent-2" />
        )
      }
      dropProps={dropProps}
      onClick={toggleSmallMode}
    />
  )

  return (
    <Box
      direction={isSmall ? "row" : "column"}
      width={isSmall ? "100%" : "48px"}
      height={isSmall ? "48px" : "100%"}
      pad="2rem"
      align="center"
      justify={isSmall ? "center" : "start"}
    >
      <ToolTipButton
        tooltip="View"
        icon={<Icons.View color={accentIfSelected("VIEW")} />}
        dropProps={dropProps}
        onClick={setAction("VIEW")}
      />
      <Divider isVertical={isSmall} />
      <ToolTipButton
        tooltip="Select"
        icon={<Icons.Select color={accentIfSelected("SELECT")} />}
        dropProps={dropProps}
        onClick={setAction("SELECT")}
      />
      <ToolTipButton
        tooltip="Move"
        icon={<Icons.Pan color={accentIfSelected("MOVE")} />}
        dropProps={dropProps}
        onClick={setAction("MOVE")}
      />
      {!isViewingShared && (
        <ToolTipButton
          tooltip="Create"
          icon={<Icons.AddCircle color={accentIfSelected("CREATE")} />}
          dropProps={dropProps}
          onClick={setAction("CREATE")}
          isDisabled={isViewingShared}
        />
      )}

      {!isViewingShared && (
        <ToolTipButton
          tooltip="Link"
          icon={<Icons.Connect color={accentIfSelected("LINK")} />}
          dropProps={dropProps}
          onClick={setAction("LINK")}
          isDisabled={isViewingShared}
        />
      )}
      {/*

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
      /> */}
      <Divider isVertical={isSmall} />
      {toggleSmallModeButton}
      <ToolTipButton
        tooltip="Zoom to fit"
        icon={<Icons.Cluster color="accent-2" />}
        dropProps={dropProps}
        onClick={() => fireFitCanvasEvent()}
      />
    </Box>
  )
}

export default NetworkGraphToolbar

const Divider: FC<{ isVertical: boolean }> = ({ isVertical }) => {
  return (
    <div
      role="divider"
      style={{
        backgroundColor: "white",
        width: isVertical ? 1 : 24,
        height: isVertical ? 24 : 1,
      }}
    />
  )
}
