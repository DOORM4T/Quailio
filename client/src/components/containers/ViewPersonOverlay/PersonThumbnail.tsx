import { Box, Image, ThemeType } from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch } from "react"
import { useDispatch, useSelector } from "react-redux"
import { ThemeContext } from "styled-components"
import { setPersonThumbnail } from "../../../store/networks/actions"
import { getCurrentNetworkId } from "../../../store/selectors/networks/getCurrentNetwork"
import {
  getPersonInFocusId,
  getPersonInFocusThumbnailURL,
} from "../../../store/selectors/ui/getPersonInFocusData"
import ToolTipButton from "../../ToolTipButton"

interface IProps {
  isEditing: boolean
}

const PersonThumbnail: React.FC<IProps> = ({ isEditing }) => {
  const dispatch: Dispatch<any> = useDispatch()
  const theme = React.useContext<ThemeType>(ThemeContext)

  const currentNetworkId = useSelector(getCurrentNetworkId)
  const currentPersonId = useSelector(getPersonInFocusId)
  const currentPersonThumbnailURL = useSelector(getPersonInFocusThumbnailURL)

  /* Do not render if no network or person is selected */
  if (!currentNetworkId || !currentPersonId) return null

  /**
   * Handle thumbnail uploading
   */
  const handleChangeThumbnail = async (fileInput: HTMLInputElement) => {
    try {
      /* Get the file (first file, multiple files at once are not accepted) */
      const file = fileInput.files ? fileInput.files[0] : null

      /* Stop if no file was uploaded */
      if (!file) throw new Error("No file was uploaded.")

      /* Update the person in the database and in global state  */
      await dispatch(
        setPersonThumbnail(currentNetworkId, currentPersonId, file),
      )
    } catch (error) {
      /* Failed to upload a thumbnail */
      console.error(error)
    }
  }

  /**
   * Open the file input menu
   */
  const openFileInput = () => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/*"
    fileInput.click()

    /* Wait for the user to upload an image file*/
    fileInput.onchange = async () => {
      await handleChangeThumbnail(fileInput)
      fileInput.remove()
    }
  }

  const setThumbnailByURL = async () => {
    const url = window.prompt("Thumbnail URL: ")
    if (!url) return

    try {
      await dispatch(setPersonThumbnail(currentNetworkId, currentPersonId, url))
    } catch (error) {
      console.error(error)
    }
  }

  const removeThumbnail = async () => {
    const doContinue = window.confirm(
      "Are you sure you want to remove this thumbnail?",
    )
    if (!doContinue) return

    try {
      await dispatch(setPersonThumbnail(currentNetworkId, currentPersonId, ""))
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Box direction="row">
      <div
        id="change-thumbnail-button"
        style={{
          background:
            theme.global?.colors?.["light-1"]?.toString() || "transparent",
          cursor: "pointer",
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.5)",
          border: "none",
          borderRadius: "4px",
          width: "128px",
          height: "128px",
          padding: "2px",
        }}
        aria-label="Person thumbnail"
        role="Click to change thumbnail"
      >
        {currentPersonThumbnailURL ? (
          <Image src={currentPersonThumbnailURL} fill />
        ) : (
          <Icons.User size="xlarge" color="dark-1" />
        )}
      </div>

      {isEditing && (
        <Box direction="column">
          <ToolTipButton
            onClick={setThumbnailByURL}
            icon={<Icons.Link />}
            id="set-url-button"
            tooltip="Link to a thumbnail"
            dropProps={{ align: { left: "right" } }}
          />
          <ToolTipButton
            icon={<Icons.Image />}
            onClick={openFileInput}
            id="set-uploaded-image-button"
            tooltip="Upload a thumbnail"
            dropProps={{ align: { left: "right" } }}
          />
          <ToolTipButton
            icon={<Icons.FormSubtract color="status-critical" />}
            onClick={removeThumbnail}
            id="remove-thumbnail-button"
            tooltip="Remove thumbnail"
            dropProps={{ align: { left: "right" } }}
          />
        </Box>
      )}
    </Box>
  )
}

export default PersonThumbnail
