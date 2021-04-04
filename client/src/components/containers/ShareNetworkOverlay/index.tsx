import { Box, Heading, RadioButtonGroup, TextInput } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { shareNetwork } from "../../../store/networks/actions/shareNetwork"
import { unshareNetwork } from "../../../store/networks/actions/unshareNetwork"
import { getCurrentNetwork } from "../../../store/selectors/networks/getCurrentNetwork"
import { getIsShareOverlayOpen } from "../../../store/selectors/ui/getIsShareOverlayOpen"
import { toggleShareOverlay } from "../../../store/ui/uiActions"
import Overlay from "../../Overlay"

interface IProps {
  id: string
}

enum sharingOptions {
  PRIVATE = "Private",
  PUBLIC = "Public",
}

const SHARING_OPTIONS = ["Private", "Public"]

const ShareNetworkOverlay: React.FC<IProps> = ({ id }) => {
  const dispatch = useDispatch()
  const isOpen = useSelector(getIsShareOverlayOpen)
  const currentNetwork = useSelector(getCurrentNetwork)

  const [sharingOption, setSharingOption] = React.useState(
    currentNetwork?.sharedProperties?.sharedId
      ? SHARING_OPTIONS[1]
      : SHARING_OPTIONS[0],
  )
  const sharedURL = currentNetwork?.sharedProperties?.sharedId
    ? `${window.location.origin}${window.location.pathname}?sharing=${currentNetwork.sharedProperties.sharedId}`
    : null

  // EFFECT | Update the sharing option whenever the current network's sharedId changes
  React.useEffect(() => {
    const option = currentNetwork?.sharedProperties?.sharedId
      ? SHARING_OPTIONS[1]
      : SHARING_OPTIONS[0]

    setSharingOption(option)
  }, [currentNetwork?.sharedProperties?.sharedId])

  // Don't render if there's no network selected
  if (!currentNetwork) return null

  // FUNCTION | Hide the sharing menu
  const handleClose = () => {
    /* Close overlay */
    dispatch(toggleShareOverlay(false))
  }

  // FUNCTION | Handle sharing option change
  const handleSharingOptionChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // Update sharing option state
    const newOption = event.target.value
    setSharingOption(newOption)

    // Dispatch a custom Redux action based on the new sharing state
    try {
      if (newOption === sharingOptions.PUBLIC.valueOf()) {
        await dispatch(shareNetwork(currentNetwork.id))
      } else {
        await dispatch(unshareNetwork(currentNetwork.id))
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Hide the overlay if it's not showing
  if (!isOpen) return null

  return (
    <Overlay id={id} handleClose={handleClose}>
      <Box
        fill
        align="center"
        margin={{ top: "xlarge" }}
        pad={{ horizontal: "xlarge" }}
      >
        <Icons.ShareOption />
        <Heading level={2} textAlign="center">
          Sharing Options
        </Heading>
        <RadioButtonGroup
          direction="row"
          name="sharingOptions"
          options={SHARING_OPTIONS}
          value={sharingOption}
          onChange={handleSharingOptionChange}
        />

        {/* Show the sharing URL if public  */}
        {sharedURL && (
          <Box margin={{ top: "large" }} align="center" width="large">
            <span>Click to copy URL</span>
            <TextInput
              value={sharedURL}
              onClick={
                // Copy URL to clipboard
                (e) => {
                  e.currentTarget.select()
                  document.execCommand("copy")
                }
              }
              textAlign="center"
            />
          </Box>
        )}
      </Box>
    </Overlay>
  )
}

export default ShareNetworkOverlay
