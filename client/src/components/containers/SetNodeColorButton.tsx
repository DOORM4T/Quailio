import {
  Paint as PaintIcon,
  TextAlignCenter as TextIcon,
} from "grommet-icons/icons"
import React, { useState } from "react"
import { ColorResult, PhotoshopPicker } from "react-color"
import { useDispatch, useSelector } from "react-redux"
import {
  GroupColorField as ColorField,
  setNodeColor,
} from "../../store/networks/actions/setNodeColor"
import { IApplicationState } from "../../store/store"
import ToolTipButton from "../ToolTipButton"

interface IProps {
  field: ColorField
  networkId: string
  nodeId: string
  buttonProps?: { [key: string]: any }
}

const SetNodeColorButton: React.FC<IProps> = ({
  field,
  networkId,
  nodeId,
  buttonProps,
}) => {
  const dispatch = useDispatch()
  const currentColor = useSelector(getNodeColor(field, nodeId)) || "#000"
  const [doShowPicker, setShowPicker] = useState(false)
  const [color, setColor] = useState(currentColor)

  const tooltip =
    field === "backgroundColor"
      ? "Change background color"
      : "Change text color"

  const Icon =
    field === "backgroundColor" ? (
      <PaintIcon color={currentColor} />
    ) : (
      <TextIcon color={currentColor} />
    )

  const togglePicker = () => {
    setShowPicker((doShow) => !doShow)
  }

  const cancelPicking = () => {
    setShowPicker(false)
  }

  const handleColorChange = (newColor: ColorResult) => {
    setColor(newColor.hex)
  }

  const acceptColorChange = async () => {
    try {
      await dispatch(setNodeColor(networkId, nodeId, field, color))
    } catch (error) {
      console.error(error)
    } finally {
      setShowPicker(false)
    }
  }

  return (
    <React.Fragment>
      <ToolTipButton
        tooltip={tooltip}
        onClick={togglePicker}
        icon={Icon}
        {...buttonProps}
      />
      <ColorPicker
        color={color}
        doShow={doShowPicker}
        acceptColorChange={acceptColorChange}
        cancelPicking={cancelPicking}
        handleColorChange={handleColorChange}
        header={
          field === "backgroundColor"
            ? "Pick Background Color"
            : "Pick Text Color"
        }
      />
    </React.Fragment>
  )
}
export default SetNodeColorButton

function getNodeColor(field: ColorField, nodeId: string) {
  return (state: IApplicationState) => {
    const person = state.networks.currentNetwork?.people.find(
      (p) => p.id === nodeId,
    )
    if (!person) return null
    return person[field]
  }
}

interface IColorPickerProps {
  doShow: boolean
  color: string
  acceptColorChange: () => Promise<void>
  handleColorChange: (newColor: ColorResult) => void
  cancelPicking: () => void
  header?: string
}
const ColorPicker: React.FC<IColorPickerProps> = ({
  doShow,
  color,
  acceptColorChange,
  handleColorChange,
  cancelPicking,
  header = "Color Picker",
}) => {
  if (!doShow) return null

  return (
    <div
      style={{
        position: "absolute",
        top: "1rem",
        left: "1rem",
        zIndex: 9999,
      }}
    >
      <PhotoshopPicker
        color={color}
        header={header}
        onAccept={acceptColorChange}
        onChange={handleColorChange}
        onCancel={cancelPicking}
      />
    </div>
  )
}
