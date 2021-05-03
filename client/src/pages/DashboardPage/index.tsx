import { Box } from "grommet"
import React from "react"
import { Helmet } from "react-helmet"
import { useSelector } from "react-redux"
import { HEADER_HEIGHT } from "../../components/containers/AppHeader"
import ForceGraphCanvas from "../../components/containers/ForceGraphCanvas/index"
import { ICurrentNetwork } from "../../store/networks/networkTypes"
import { IApplicationState } from "../../store/store"
import useDashboard from "./logic/useDashboard"
import HeaderMenu from "./MenuHeader"
import PersonMenu from "./PersonMenu"

const DashboardPage: React.FC = () => {
  const {
    currentNetwork,
    doShowPersonMenu,
    isSmall,
    isZeroLoginMode,
    isAuthenticated,
    isViewingShared,
    networks,
    setShowPersonMenu,
    groupsByPersonId,
    groupVisibility,
  } = useDashboard()

  const visibleNodes = useSelector(
    (state: IApplicationState) => state.ui.personNodeVisibility,
  )

  const networkWithVisibleNodes: ICurrentNetwork | null = currentNetwork
    ? {
        ...currentNetwork,
        people: currentNetwork.people.filter(
          (p) => visibleNodes[p.id] !== false, // True and undefined mean the node is visible
        ),
      }
    : null // networkWithActiveNodes

  // Wrapper for a Person Menu. Hidden if doShowPersonMenu state is false
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
  ) : null // PersonMenuWrapper

  return (
    <React.Fragment>
      {/* Set the page title to the network */}
      {isViewingShared && currentNetwork ? (
        <Helmet>
          <title>{currentNetwork.name} (Shared Network)</title>
          <meta
            name="description"
            content={`${currentNetwork.name} on Quailio`}
          />
        </Helmet>
      ) : (
        <Helmet>
          <title>Dashboard</title>
        </Helmet>
      )}

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
              currentNetwork={networkWithVisibleNodes}
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
