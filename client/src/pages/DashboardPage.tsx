import {
  Box,
  Button,
  DropButton,
  List,
  ResponsiveContext,
  Text,
  Tip,
} from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { ActionCreator, AnyAction } from "redux"
import ForceGraphCanvas from "../components/containers/ForceGraphCanvas"
import PersonMenu from "../components/containers/PersonMenu"
import ViewPersonOverlay from "../components/containers/ViewPersonOverlay"
import { HEADER_HEIGHT } from "../components/Header"
import useGetNetworks from "../hooks/networks/useGetNetworks"
import {
  addPerson,
  createNetwork,
  deleteNetwork,
  setNetwork,
} from "../store/networks/networksActions"
import { ICurrentNetwork, INetwork } from "../store/networks/networkTypes"
import { IApplicationState } from "../store/store"

const DashboardPage: React.FC = () => {
  /* get all network data for an authenticated user */
  useGetNetworks()

  const dispatch: ActionCreator<AnyAction> = useDispatch()
  const networks = useSelector<IApplicationState, INetwork[]>(
    (state) => state.networks.networks,
  )
  const currentNetwork = useSelector<IApplicationState, ICurrentNetwork | null>(
    (state) => state.networks.currentNetwork,
  )

  /* responsive breakpoints */
  const size = React.useContext(ResponsiveContext)
  const isSmall = size === "xsmall" || size === "small"

  /* Network select button ref */
  const networkSelectRef = React.useRef<any>(null)

  /* View person menu open state */
  const isEditMenuOpen = useSelector<IApplicationState, boolean>(
    (state) => state.ui.isPersonEditMenuOpen,
  )

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
  const addPersonHandler = async () => {
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

    /* update state */
    try {
      await dispatch(addPerson(currentNetwork.id, name))
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteNetwork = async () => {
    if (!currentNetwork) return

    /* confirm deletion */
    const doDelete = window.confirm(`Delete network: ${currentNetwork.name}?`)
    if (!doDelete) {
      alert(`Did not delete ${currentNetwork.name}`)
      return
    }

    /* update state */
    try {
      await dispatch(deleteNetwork(currentNetwork.id))
    } catch (error) {
      console.error(error)
    }
  }

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

  return (
    <React.Fragment>
      <Box
        direction={isSmall ? "column-reverse" : "row"}
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        background="light-1"
      >
        {/* Network Actions & Details */}
        <Box
          direction="column"
          justify="start"
          align="stretch"
          background="light-1"
          width="large"
          gap="none"
        >
          <Box
            direction="row"
            justify="start"
            gap="small"
            height="50px"
            margin="small"
          >
            <DropButton
              id="select-network-dropbutton"
              ref={networkSelectRef}
              style={{
                borderRadius: "4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                padding: "0 1rem",
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
                  icon={<Icons.Add color="brand" />}
                  onClick={handleCreateNetwork}
                  hoverIndicator
                  style={{
                    border: "1px solid green",
                    width: "50px",
                    height: "50px",
                  }}
                />
              }
            />
          </Box>
          <Box direction="column" fill>
            {currentNetwork && (
              <Box>
                {/* Network actions */}
                <Box
                  direction="row"
                  fill="horizontal"
                  justify="start"
                  pad={{ horizontal: "small" }}
                  margin={{ vertical: "small" }}
                  height="50px"
                >
                  <Tip
                    content="Add person"
                    children={
                      <Button
                        id="add-person-button"
                        aria-label="Add a person to the network"
                        icon={<Icons.UserAdd color="brand" />}
                        onClick={addPersonHandler}
                        disabled={!currentNetwork}
                        hoverIndicator
                      />
                    }
                  />

                  <Tip
                    content="Delete current network"
                    children={
                      <Button
                        aria-label="Delete current network"
                        icon={<Icons.Threats color="status-critical" />}
                        onClick={handleDeleteNetwork}
                        disabled={!currentNetwork}
                        hoverIndicator
                        margin={{ left: "auto" }}
                      />
                    }
                  />
                </Box>
                <Box
                  background="light-2"
                  margin="small"
                  style={{ boxShadow: "inset 0 0 8px rgba(0,0,0,0.5)" }}
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
        </Box>
        <ForceGraphCanvas
          id="network-sketch"
          state={currentNetwork}
          style={{ overflow: "hidden", backgroundColor: "#DDD" }}
        />
      </Box>

      {/* -== VIEW PERSON OVERLAY ==- */}
      {isEditMenuOpen && <ViewPersonOverlay id="view-person-overlay" />}
    </React.Fragment>
  )
}

export default DashboardPage
