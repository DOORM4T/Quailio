import { Box, Button, Grid, Heading, Image, Layer, Stack } from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  deleteThumbnail,
  getNetworkThumbnails,
  IThumbnailDetails,
} from "../../../firebase/thumbnailManagement"
import useAuth from "../../../hooks/auth/useAuth"
import useSmallBreakpoint from "../../../hooks/useSmallBreakpoint"
import {
  setNetworkLoading,
  setPersonThumbnail,
} from "../../../store/networks/actions"
import { getCurrentNetworkId } from "../../../store/selectors/networks/getCurrentNetwork"
import {
  getPersonInFocusData,
  getPersonInFocusThumbnailURL,
} from "../../../store/selectors/ui/getPersonInFocusData"
import ToolTipButton from "../../ToolTipButton"
import SetNodeColorButton from "../SetNodeColorButton"

/* Limit for data urls as image links
    This value is equivalent to the max size for a field value -- 1MiB - 89 bytes
    This keeps an uploaded network from breaking
    According to https://firebase.google.com/docs/firestore/quotas
*/
const MAX_DATA_URL_SIZE = 1_048_487

interface IProps {
  isEditing: boolean
}

const PersonThumbnail: React.FC<IProps> = ({ isEditing }) => {
  const dispatch: Dispatch<any> = useDispatch()
  const { isAuthenticated } = useAuth()
  const isSmall = useSmallBreakpoint()

  const currentNetworkId = useSelector(getCurrentNetworkId)
  const currentPerson = useSelector(getPersonInFocusData)
  const currentPersonThumbnailURL = useSelector(getPersonInFocusThumbnailURL)

  const [isThumbnailsOverlayOpen, setThumbnailsOverlayOpen] =
    React.useState<boolean>(false)

  const [uploadedThumbnails, setUploadedThumbnails] = React.useState<
    IThumbnailDetails[]
  >([])

  /* Do not render if no network or person is selected */
  if (!currentNetworkId || !currentPerson) return null

  /**
   * Handle thumbnail uploading
   */
  const handleUploadThumbnail = async (fileInput: HTMLInputElement) => {
    try {
      // Get the file (first file, multiple files at once are not accepted)
      const file = fileInput.files ? fileInput.files[0] : null

      // Stop if no file was uploaded
      if (!file) throw new Error("No file was uploaded.")

      // Update the person in the database and in global state
      await dispatch(
        setPersonThumbnail(currentNetworkId, currentPerson.id, file),
      )
    } catch (error) {
      // Failed to upload a thumbnail
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

    // Wait for the user to upload an image file
    fileInput.onchange = async () => {
      await handleUploadThumbnail(fileInput)
      fileInput.remove()
    }
  }

  const setThumbnailByURL = async () => {
    const url = window.prompt(
      "Thumbnail URL: ",
      currentPersonThumbnailURL || "",
    )
    if (!url || url.length > MAX_DATA_URL_SIZE) return

    try {
      await dispatch(
        setPersonThumbnail(currentNetworkId, currentPerson.id, url),
      )
    } catch (error) {
      console.error(error)
    }
  }

  // Allow the user to select a thumbnail they previously uploaded
  const selectPreviouslyUploaded = async () => {
    // Close the thumbnail overlay if it's already open
    if (isThumbnailsOverlayOpen) {
      setThumbnailsOverlayOpen(false)
      return
    }

    // Open the thumbnail overlay
    try {
      // Stop if the user isn't authenticated -- they couldn't have uploaded any thumbnails!
      if (!isAuthenticated) throw new Error("Not authenticated")

      dispatch(setNetworkLoading(true))

      // Get thumbnails and place them in state
      const thumbnails = await getNetworkThumbnails(currentNetworkId)
      setUploadedThumbnails(thumbnails)

      // Open the overlay that will display these thumbnails
      setThumbnailsOverlayOpen(true)

      dispatch(setNetworkLoading(false))
    } catch (error) {
      dispatch(setNetworkLoading(false))
      console.error(error)
    }
  }

  const removeThumbnail = async () => {
    const doContinue = window.confirm(
      "Are you sure you want to remove this thumbnail?",
    )
    if (!doContinue) return

    try {
      await dispatch(setPersonThumbnail(currentNetworkId, currentPerson.id, ""))
    } catch (error) {
      console.error(error)
    }
  }

  const Thumbnail: React.ReactNode = (
    <Box
      background="light-1"
      width="128px"
      height="128px"
      style={{
        borderRadius: "4px",
      }}
      aria-label="Person thumbnail"
    >
      {currentPersonThumbnailURL ? (
        <Image src={currentPersonThumbnailURL} fill />
      ) : currentPerson.isGroup ? (
        <Icons.Folder color="dark-1" size="xxlarge" />
      ) : (
        <Icons.User color="dark-1" size="xxlarge" />
      )}
    </Box>
  )

  const LeftThumbnailButtons: React.ReactNode = isEditing && (
    <Box direction="column">
      <ToolTipButton
        onClick={setThumbnailByURL}
        icon={<Icons.Link />}
        id="set-url-button"
        tooltip="Link to a thumbnail"
        dropProps={{ align: isSmall ? { top: "bottom" } : { bottom: "top" } }}
      />

      <ToolTipButton
        icon={<Icons.Image />}
        onClick={openFileInput}
        id="set-uploaded-image-button"
        tooltip={`Upload a thumbnail ${isAuthenticated ? "(1 MB Limit)" : ""}`}
        dropProps={{ align: { top: "bottom" } }}
      />

      {isAuthenticated && (
        <React.Fragment>
          <ToolTipButton
            icon={<Icons.AppsRounded />}
            onClick={selectPreviouslyUploaded}
            id="select-previously-uploaded-image-button"
            tooltip="Select a previously uploaded image"
            dropProps={{ align: { top: "bottom" } }}
          />
        </React.Fragment>
      )}
    </Box>
  )

  const RightThumbnailButtons: React.ReactNode = isEditing && (
    <Box direction="column">
      {/* Show the delete thumbnail button if there's a thumbnail */}
      {currentPersonThumbnailURL && (
        <ToolTipButton
          icon={<Icons.FormSubtract color="status-critical" />}
          onClick={removeThumbnail}
          id="remove-thumbnail-button"
          tooltip="Remove thumbnail"
          dropProps={{ align: isSmall ? { top: "bottom" } : { bottom: "top" } }}
        />
      )}
      <SetNodeColorButton
        field="backgroundColor"
        networkId={currentNetworkId}
        nodeId={currentPerson.id}
      />
      <SetNodeColorButton
        field="textColor"
        networkId={currentNetworkId}
        nodeId={currentPerson.id}
      />
    </Box>
  )

  return (
    <React.Fragment>
      <Box direction="row">
        {LeftThumbnailButtons}

        {Thumbnail}

        {RightThumbnailButtons}
      </Box>
      {isThumbnailsOverlayOpen && (
        <ThumbnailsOverlay
          networkId={currentNetworkId}
          personId={currentPerson.id}
          currentThumbnailURL={currentPersonThumbnailURL}
          thumbnailDetails={uploadedThumbnails}
          setOpen={setThumbnailsOverlayOpen}
          setUploadedThumbnails={setUploadedThumbnails}
        />
      )}
    </React.Fragment>
  )
}

//
// Uploaded Thumbnails Overlay
//
interface IThumbnailsOverlayProps {
  networkId: string
  personId: string
  currentThumbnailURL: string | null
  thumbnailDetails: IThumbnailDetails[]
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  setUploadedThumbnails: React.Dispatch<
    React.SetStateAction<IThumbnailDetails[]>
  >
}

const ThumbnailsOverlay: React.FC<IThumbnailsOverlayProps> = ({
  networkId,
  personId,
  currentThumbnailURL,
  thumbnailDetails,
  setOpen,
  setUploadedThumbnails,
}) => {
  const dispatch: Dispatch<any> = useDispatch()
  const [inDeleteMode, setDeleteMode] = React.useState<boolean>(false)

  const handleToggleEditMode = () => {
    setDeleteMode(!inDeleteMode)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSelectThumbnail = (url: string) => async () => {
    // Stop if the thumbnail is already used by the person
    if (url === currentThumbnailURL) return

    try {
      // Set the thumbnail for the person in global state
      await dispatch(setPersonThumbnail(networkId, personId, url))

      // Close the overlay
      handleClose()
    } catch (error) {
      console.error(error)
    }
  }

  // Delete the thumbnail from the back end storage bucket
  // Takes the path to the storage bucket to delete from
  const handleDeleteThumbnail =
    ({ path, url }: IThumbnailDetails) =>
    async () => {
      // Ensure the user wants to delete the thumbnail
      const doContinue = window.confirm(
        "Are you sure you want to delete this thumbnail?",
      )
      if (!doContinue) return

      try {
        // Delete the thumbnail
        await deleteThumbnail(path)

        // Remove the current person's thumbnail in global state if it was deleted
        if (url === currentThumbnailURL) {
          await dispatch(setPersonThumbnail(networkId, personId, ""))
        }

        // Set thumbnails state to re-render available thumbnails
        const thumbnails = await getNetworkThumbnails(networkId)
        setUploadedThumbnails(thumbnails)
      } catch (error) {
        console.error(error)
      }
    }

  return (
    <Layer onEsc={handleClose}>
      <Box width="xlarge" height="large">
        <Box fill="horizontal" background="brand" direction="row">
          <Heading level={2} margin={{ horizontal: "auto" }}>
            Select a Previously Uploaded Thumbnail:
          </Heading>
          <Button
            icon={<Icons.Edit color="accent-1" />}
            aria-label="Open thumbnails edit mode"
            onClick={handleToggleEditMode}
            style={{ float: "right" }}
          />
          <Button
            icon={<Icons.Close />}
            aria-label="Close uploaded thumbnails overlay"
            onClick={handleClose}
            margin={{ right: "medium" }}
            style={{ float: "right" }}
          />
        </Box>
        <Grid
          columns="xsmall"
          rows="xsmall"
          gap="medium"
          pad="medium"
          margin={{ horizontal: "auto" }}
        >
          {thumbnailDetails.map((d, index) => (
            <Stack anchor="top-right" key={index}>
              <Box
                // Highlight the currently selected thumbnail, if it exists among the uploaded thumbnails
                background={
                  d.url === currentThumbnailURL ? "dark-2" : "light-1"
                }
                border={
                  d.url === currentThumbnailURL
                    ? {
                        color: "status-ok",
                        size: "medium",
                      }
                    : undefined
                }
                onClick={handleSelectThumbnail(d.url)}
                hoverIndicator
              >
                <Image src={d.url} alt={d.url} />
              </Box>
              {inDeleteMode && (
                <Box background="status-critical">
                  <Button
                    icon={<Icons.Trash color="light-1" size="small" />}
                    hoverIndicator
                    onClick={handleDeleteThumbnail(d)}
                  />
                </Box>
              )}
            </Stack>
          ))}
        </Grid>
      </Box>
    </Layer>
  )
}

export default PersonThumbnail
