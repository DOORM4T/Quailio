import { Box, Button, Tip } from "grommet"
import React, { CSSProperties } from "react"

interface IProps {
  id: string
  tooltip: string
  icon: JSX.Element
  onClick: () => void
  isDisabled: boolean
  ariaLabel: string
  buttonStyle?: CSSProperties
}

const ToolTipButton: React.FC<IProps> = (props) => {
  return (
    <Tip
      content={props.tooltip}
      children={
        <Button
          id={props.id}
          aria-label={props.ariaLabel || props.tooltip}
          icon={props.icon}
          onClick={props.onClick}
          disabled={props.isDisabled}
          hoverIndicator
          style={props.buttonStyle}
        />
      }
    />
  )
}

export default ToolTipButton
