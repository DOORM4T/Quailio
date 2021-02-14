import { Box, Button, DropButton, List, Text, Tip } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { ActionCreator, AnyAction } from "redux"
import ForceGraphCanvas from "../components/containers/ForceGraphCanvas/index"
import PersonMenu from "../components/containers/PersonMenu"
import ViewPersonOverlay from "../components/containers/ViewPersonOverlay"
import ToolTipButton from "../components/ToolTipButton"
import { HEADER_HEIGHT } from "../constants"
import { getNetworkJSON } from "../firebase/getNetworkJSON"
import useGetNetworks from "../hooks/networks/useGetNetworks"
import useSmallBreakpoint from "../hooks/useSmallBreakpoint"
import {
  addPerson,
  createNetwork,
  deleteNetwork,
  setNetwork,
  setNetworkLoading,
} from "../store/networks/actions"
import { INetwork } from "../store/networks/networkTypes"
import { getAllNetworkData } from "../store/selectors/networks/getAllNetworkData"
import { getCurrentNetwork } from "../store/selectors/networks/getCurrentNetwork"
import { getIsOverlayOpen } from "../store/selectors/ui/getIsOverlayOpen"

const DashboardPage: React.FC = () => {
  /* Fetch network data*/
  useGetNetworks()

  /* Access global state */
  const dispatch: ActionCreator<AnyAction> = useDispatch()
  const networks = useSelector(getAllNetworkData)
  const currentNetwork = useSelector(getCurrentNetwork)
  const isOverlayOpen = useSelector(getIsOverlayOpen)

  /* responsive breakpoints */
  const isSmall = useSmallBreakpoint()

  /* Network select button ref */
  const networkSelectRef = React.useRef<any>(null)

  /* Select Network Function */
  const handleNetworkSelect = async (event: any) => {
    try {
      if (!event.item) throw new Error("Network not found.")
      await dispatch(setNetwork(event.item.id))

      if (networkSelectRef.current) {
        ;(networkSelectRef.current as HTMLButtonElement).click()
      }
    } catch (error) {
      console.error(error)
    }
  }

  //                                 //
  // -== ACTION BUTTON FUNCTIONS ==- //
  //                                 //

  /* Create Network Function */
  const handleCreateNetwork = async () => {
    const networkName = window.prompt("Name your network:")
    if (!networkName) {
      alert("Canceled network creation")
      return
    }

    try {
      dispatch(createNetwork(networkName))
    } catch (error) {
      console.error(error)
    }
  }

  /* Add Person Function */
  const handleAddPerson = async () => {
    if (!currentNetwork) {
      alert("Please select a Network!")
      return
    }

    /* get name of person to add */
    const name = window.prompt("Name of person:")
    if (!name) {
      alert("Canceled add person action")
      return
    }

    /* Update state */
    try {
      await dispatch(addPerson(currentNetwork.id, name))
    } catch (error) {
      console.error(error)
    }
  }

  /* Delete Network Function */
  const handleDeleteNetwork = async () => {
    if (!currentNetwork) return

    /* Confirm deletion */
    const doDelete = window.confirm(`Delete network: ${currentNetwork.name}?`)
    if (!doDelete) {
      alert(`Did not delete ${currentNetwork.name}`)
      return
    }

    /* Update state */
    try {
      await dispatch(deleteNetwork(currentNetwork.id))
    } catch (error) {
      console.error(error)
    }
  }

  /* Export Network to JSON Function */
  const handleExportToJSON = async () => {
    /* Stop if no network is selected */
    if (!currentNetwork) return

    try {
      /* Set loading */
      await dispatch(setNetworkLoading(true))

      /* Get the network as JSON */
      const networkJSON = await getNetworkJSON(currentNetwork.id)

      /* Stop if no data was found */
      if (!networkJSON) return

      /* Convert the JSON to an Object URL */
      const stringJSON = JSON.stringify(networkJSON)
      const encoded = Buffer.from(stringJSON)
      const blob = new Blob([encoded], { type: "application/json" })
      const objectURL = URL.createObjectURL(blob)

      /* Download the JSON via Object URL */
      const downloadElement = document.createElement("a")
      const networkNameWithoutSpaces = currentNetwork.name.replace(/\s/g, "")
      downloadElement.download = `${networkNameWithoutSpaces}_export.json`
      downloadElement.href = objectURL
      downloadElement.click()
      downloadElement.remove()
    } catch (error) {
      /* Failed to get the network JSON */
      console.error(error)
    } finally {
      /* Disable network loading */
      await dispatch(setNetworkLoading(false))
    }
  }

  return (
    <React.Fragment>
      <Box
        direction={isSmall ? "column" : "row"}
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        background="dark-1"
      >
        {/* Network Actions & Details */}
        <Box direction="column" justify="start" align="stretch" width="large">
          <Box
            direction="row"
            justify="start"
            align="center"
            gap="small"
            height="auto"
            margin="small"
            pad="medium"
          >
            <DropButton
              id="select-network-dropbutton"
              color="accent-1"
              ref={networkSelectRef}
              style={{
                borderRadius: "4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                height: "50px",
              }}
              aria-label="Select a network"
              label={
                currentNetwork
                  ? `Network: ${currentNetwork.name}`
                  : "Select Network"
              }
              dropAlign={{ top: "bottom" }}
              dropContent={
                networks ? (
                  <List
                    id="select-network-list"
                    primaryKey={"name"}
                    data={networks}
                    onClickItem={handleNetworkSelect}
                    background="dark-1"
                    border={{
                      color: "accent-1",
                      side: "horizontal",
                      size: "small",
                    }}
                    pad="medium"
                    style={{
                      overflow: "auto",
                      maxHeight: "500px",
                    }}
                  />
                ) : (
                  <Text>You haven't created any networks... yet!</Text>
                )
              }
              disabled={networks.length === 0}
              fill="horizontal"
            />

            <Tip
              content="Create a new network"
              children={
                <Button
                  id="create-network-button"
                  aria-label="Create a new network"
                  icon={<Icons.Add color="accent-3" />}
                  onClick={handleCreateNetwork}
                  hoverIndicator
                  color="accent-3"
                  style={{
                    border: "2px solid",
                    width: "50px",
                    height: "50px",
                    borderRadius: "2px",
                  }}
                />
              }
            />
          </Box>
          {currentNetwork && (
            <Box direction="column">
              <Box
                direction="row"
                fill="horizontal"
                justify="start"
                align="center"
                pad={isSmall ? "medium" : { horizontal: "medium" }}
              >
                <NetworkButtons
                  currentNetwork={currentNetwork}
                  handleAddPerson={handleAddPerson}
                  handleDeleteNetwork={handleDeleteNetwork}
                  handleExportToJSON={handleExportToJSON}
                />
              </Box>
              <Box
                background="light-2"
                margin="small"
                style={{ boxShadow: "inset 0 0 8px rgba(0,0,0,0.5)" }}
                overflow={{ vertical: "auto" }}
              >
                <PersonMenu
                  id="person-menu"
                  data={
                    currentNetwork
                      ? currentNetwork.people.sort((p1, p2) =>
                          p1.name.localeCompare(p2.name),
                        )
                      : []
                  }
                />
              </Box>
            </Box>
          )}
        </Box>
        <ForceGraphCanvas
          id="network-sketch"
          state={currentNetwork}
          style={{ overflow: "hidden", backgroundColor: "#DDD" }}
        />
      </Box>

      {/* -== VIEW PERSON OVERLAY ==- */}
      {isOverlayOpen && <ViewPersonOverlay id="view-person-overlay" />}
    </React.Fragment>
  )
}

export default DashboardPage

// -== NETWORK ACTION BUTTONS ==- //
interface INetworkButtonsProps {
  currentNetwork: INetwork
  handleAddPerson: () => void
  handleDeleteNetwork: () => void
  handleExportToJSON: () => void
}

const NetworkButtons: React.FC<INetworkButtonsProps> = (props) => {
  return (
    <React.Fragment>
      <ToolTipButton
        id="add-person-button"
        tooltip="Add person"
        ariaLabel="Add a person to the network"
        icon={<Icons.UserAdd color="brand" />}
        onClick={props.handleAddPerson}
        isDisabled={!props.currentNetwork}
      />
      <ToolTipButton
        id="export-network-json-button"
        tooltip="Export network to JSON"
        ariaLabel="Export the network as a JSON file"
        icon={<Icons.Download color="brand" />}
        onClick={props.handleExportToJSON}
        isDisabled={!props.currentNetwork}
      />

      <Box margin={{ left: "auto" }}>
        <ToolTipButton
          id="delete-network-button"
          tooltip="Delete current network"
          ariaLabel="Delete current network"
          icon={<Icons.Threats color="status-critical" />}
          onClick={props.handleDeleteNetwork}
          isDisabled={!props.currentNetwork}
        />
      </Box>
    </React.Fragment>
  )
}
