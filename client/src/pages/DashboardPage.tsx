import {
  Box,
  Button,
  DropButton,
  Heading,
  ResponsiveContext,
  Tip,
} from "grommet"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { ActionCreator, AnyAction } from "redux"
import ForceGraphCanvas from "../components/containers/ForceGraphCanvas"
import PersonMenu from "../components/containers/PersonMenu"
import { HEADER_HEIGHT } from "../components/Header"
import useGetNetworks from "../hooks/networks/useGetNetworks"
import {
  addPerson,
  createNetwork,
  deleteNetwork,
  getAllPeople,
  setNetwork,
} from "../store/networks/networksActions"
import { ICurrentNetwork, INetwork } from "../store/networks/networkTypes"
import { IApplicationState } from "../store/store"
import * as Icons from "grommet-icons"

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
      await dispatch(getAllPeople(currentNetwork.id))
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
  const handleNetworkSelect = (id: string) => {
    return async () => {
      try {
        dispatch(setNetwork(id))
      } catch (error) {
        console.error(error)
      }
    }
  }

  /* Menu component of the user's Networks for the Select Network dropdown */
  const NetworkMenu = () => {
    if (!networks || networks.length === 0) return <Box />

    return (
      <Box
        direction="column"
        style={{ maxHeight: "240px", overflowY: "auto", overflowX: "hidden" }}
      >
        {networks.map((network) => {
          if (!network) return

          return (
            <Box
              pad={{ horizontal: "medium", vertical: "small" }}
              key={`${network.id}`}
              onClick={handleNetworkSelect(network.id)}
              hoverIndicator
            >
              {network.name}
            </Box>
          )
        })}
      </Box>
    )
  }

  return (
    <React.Fragment>
      <Box
        direction={isSmall ? "column-reverse" : "row"}
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        background="light-1"
      >
        <Box
          direction="column"
          pad={{ horizontal: "small", bottom: "large" }}
          background="light-1"
          width={{ min: "360px" }}
        >
          <Box pad="small" gap="small" fill="horizontal" height="small">
            <Box direction="row" fill="horizontal" justify="center" gap="small">
              <DropButton
                style={{
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  padding: "0 1rem",
                }}
                aria-label="Select a network"
                label={
                  currentNetwork
                    ? `Network: ${currentNetwork.name}`
                    : "Select Network"
                }
                dropAlign={{ top: "bottom" }}
                dropContent={NetworkMenu()}
                disabled={networks.length === 0}
                fill="horizontal"
              />

              <Tip
                content="Create a new network"
                children={
                  <Button
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
          </Box>
          {currentNetwork && (
            <Box fill="vertical">
              {/* Network title */}
              <Heading level={3} textAlign="center">
                {currentNetwork.name}
              </Heading>

              {/* Network actions */}
              <Box
                direction="row"
                fill="horizontal"
                justify="start"
                pad={{ horizontal: "small" }}
                height="xsmall"
              >
                <Tip
                  content="Add person"
                  children={
                    <Button
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
              <PersonMenu data={currentNetwork ? currentNetwork.people : []} />
            </Box>
          )}
        </Box>
        <ForceGraphCanvas
          id="network-sketch"
          state={currentNetwork}
          style={{ overflow: "hidden", backgroundColor: "#DDD" }}
        />
      </Box>
    </React.Fragment>
  )
}

export default DashboardPage
