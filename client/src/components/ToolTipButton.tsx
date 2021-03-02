import { Button, DropProps, Tip } from "grommet"
import React, { CSSProperties } from "react"

interface IProps {
  id: string
  tooltip: string
  icon: JSX.Element
  onClick?: () => void
  isDisabled?: boolean
  ariaLabel?: string
  buttonStyle?: CSSProperties
  dropProps?: DropProps
}

const ToolTipButton: React.FC<IProps> = (props) => {
  const StandaloneButton: React.ReactNode = (
    <Button
      id={props.id}
      aria-label={props.ariaLabel || props.tooltip}
      icon={props.icon}
      onClick={props.onClick}
      disabled={props.isDisabled}
      hoverIndicator
      style={props.buttonStyle}
    />
  )

  if (props.isDisabled)
    return <React.Fragment>{StandaloneButton}</React.Fragment>
  else
    return (
      <Tip
        content={props.tooltip}
        children={StandaloneButton}
        dropProps={props.dropProps}
      />
    )
}

ToolTipButton.defaultProps = {
  isDisabled: false,
}

export default ToolTipButton
