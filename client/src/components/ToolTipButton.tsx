import { Box, Button, Tip } from "grommet"
import React from "react"

interface IProps {
  id: string
  tooltip: string
  icon: JSX.Element
  onClick: () => void
  isDisabled: boolean
  ariaLabel: string
}

const ToolTipButton: React.FC<IProps> = (props) => {
  return (
    <Tip
      content={props.tooltip}
      children={
        <Button
          id={props.id}
          aria-label={props.ariaLabel || "Button"}
          icon={props.icon}
          onClick={props.onClick}
          disabled={props.isDisabled}
          hoverIndicator
        />
      }
    />
  )
}

export default ToolTipButton
