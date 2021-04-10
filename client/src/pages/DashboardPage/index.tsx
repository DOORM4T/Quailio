import { Box } from "grommet"
import React from "react"
import { HEADER_HEIGHT } from "../../components/containers/AppHeader"
import ForceGraphCanvas from "../../components/containers/ForceGraphCanvas/index"
import { ICurrentNetwork } from "../../store/networks/networkTypes"
import HeaderMenu from "./MenuHeader"
import PersonMenu from "./PersonMenu"
import useDashboard from "./logic/useDashboard"

const DashboardPage: React.FC = () => {
  // CUSTOM HOOK | Use dashboard states and other hooks
  const {
    currentNetwork,
    doShowNodesWithoutGroups,
    doShowPersonMenu,
    groupIdsByPersonId,
    isSmall,
    isZeroLoginMode,
    isAuthenticated,
    networks,
    setShowPersonMenu,
  } = useDashboard()

  // VARS | Will only show nodes that have at least one active group
  const networkWithActiveNodes: ICurrentNetwork | null = currentNetwork
    ? {
        ...currentNetwork,
        people: doShowNodesWithoutGroups
          ? currentNetwork.people // Show all people if showing nodes without groups
          : currentNetwork.people.filter((person) => {
              // Show just people with groups if NOT showing nodes without groups
              // Hide the node if none of its groups are active
              const groupIds = groupIdsByPersonId[person.id]
              const doHideNode = groupIds && groupIds.length === 0
              return !doHideNode
            }),
      }
    : null // END | networkWithActiveNodes

  // UI | Wrapper for a Person Menu. Hidden if doShowPersonMenu state is false
  const PersonMenuWrapper: React.ReactNode = doShowPersonMenu ? (
    <Box
      direction="column"
      justify="start"
      align="stretch"
      width="large"
      height={isSmall ? "50%" : "100%"}
    >
      <PersonMenu
        people={
          currentNetwork
            ? currentNetwork.people.sort((p1, p2) =>
                p1.name.localeCompare(p2.name),
              )
            : []
        }
      />
    </Box>
  ) : null // END | PersonMenuWrapper

  return (
    <React.Fragment>
      <HeaderMenu
        networks={networks}
        currentNetwork={currentNetwork}
        isZeroLoginMode={isZeroLoginMode}
        doShowPersonMenu={doShowPersonMenu}
        setShowPersonMenu={setShowPersonMenu} // HeaderMenu includes a button that will toggle showPersonState
      />
      <Box
        direction={isSmall ? "column" : "row"}
        background="dark-1"
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        fill
      >
        {currentNetwork ? (
          <React.Fragment>
            {PersonMenuWrapper}
            <ForceGraphCanvas
              id="network-sketch"
              currentNetwork={networkWithActiveNodes}
              style={{ overflow: "hidden", backgroundColor: "#DDD" }}
            />
          </React.Fragment>
        ) : (
          <Box margin={{ top: "xlarge", horizontal: "auto" }}>
            Create{isAuthenticated && ", select, "} or import a network!
          </Box>
        )}
      </Box>
    </React.Fragment>
  )
}

export default DashboardPage
