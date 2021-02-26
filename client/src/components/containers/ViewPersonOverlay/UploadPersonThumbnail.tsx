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

const UploadPersonThumbnail: React.FC = () => {
  const dispatch: Dispatch<any> = useDispatch()
  const thumbnailUploadRef = React.useRef<HTMLInputElement>(null) // Reference to the thumbnail file input DOM element
  const theme = React.useContext<ThemeType>(ThemeContext)

  const currentNetworkId = useSelector(getCurrentNetworkId)
  const currentPersonId = useSelector(getPersonInFocusId)
  const currentPersonThumbnailURL = useSelector(getPersonInFocusThumbnailURL)

  /* Do not render if no network or person is selected */
  if (!currentNetworkId || !currentPersonId) return null

  /**
   * Open the file input menu
   */
  const openFileInput = () => {
    const fileInput = thumbnailUploadRef.current
    fileInput?.click()
  }

  /**
   * Handle thumbnail uploading
   */
  const handleChangeThumbnail = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const fileInput = e.currentTarget

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

  return (
    <Box>
      <button
        id="change-thumbnail-button"
        onClick={openFileInput}
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
        <input
          id="thumbnail-upload-input"
          ref={thumbnailUploadRef}
          type="file"
          name="thumbnail-upload"
          hidden
          onChange={handleChangeThumbnail}
        />
        {currentPersonThumbnailURL ? (
          <Image src={currentPersonThumbnailURL} fill />
        ) : (
          <Icons.User size="xlarge" color="dark-1" />
        )}
      </button>
    </Box>
  )
}

export default UploadPersonThumbnail
