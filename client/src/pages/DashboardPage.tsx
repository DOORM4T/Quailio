import { Box, Button, DropButton, Heading, ResponsiveContext } from "grommet"
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
      await dispatch(setNetwork(null))
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
      <Box direction="column">
        {networks.map((network) => {
          return (
            <Box
              key={`${network.id}`}
              onClick={handleNetworkSelect(network.id)}
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
        direction={isSmall ? "column" : "row"}
        flex={{ grow: 1 }}
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        background="light-1"
      >
        <Box
          direction="column"
          width={{ min: "360px" }}
          pad={{ horizontal: "small", bottom: "small" }}
          background="light-1"
        >
          <Box
            pad="small"
            gap="small"
            fill="horizontal"
            height="small"
            align="center"
          >
            <DropButton
              label={
                (currentNetwork &&
                  `Selected Network: ${currentNetwork.name}`) ||
                "Select Network"
              }
              dropAlign={{ top: "bottom" }}
              dropContent={NetworkMenu()}
              disabled={networks.length === 0}
              fill="horizontal"
            />
            <Box direction="row" gap="small" fill="horizontal" justify="center">
              <Button
                label="New Network"
                onClick={handleCreateNetwork}
                fill="horizontal"
              />
              <Button
                label="Delete Network"
                onClick={handleDeleteNetwork}
                disabled={!currentNetwork}
                fill="horizontal"
              />
            </Box>
          </Box>
          <Box>
            <Heading level={3}>Network</Heading>
            <Button
              label="Add Person"
              onClick={addPersonHandler}
              disabled={!currentNetwork}
            />
            <PersonMenu data={currentNetwork ? currentNetwork.people : []} />
          </Box>
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
