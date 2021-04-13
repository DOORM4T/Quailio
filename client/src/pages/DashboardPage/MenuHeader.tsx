import { Box, Text, Tip } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useHistory } from "react-router"
import AppHeader from "../../components/containers/AppHeader"
import ToolTipButton from "../../components/ToolTipButton"
import { INetwork } from "../../store/networks/networkTypes"
import useMenuHeader from "./logic/useMenuHeader"

export interface IMenuHeaderProps {
  networks: INetwork[]
  currentNetwork: INetwork | null
  isZeroLoginMode: boolean
  doShowPersonMenu: boolean // Whether the PersonMenu is open or not
  setShowPersonMenu: React.Dispatch<React.SetStateAction<boolean>> // used to toggle showPerson state
}

export const HeaderMenu: React.FC<IMenuHeaderProps> = (props) => {
  const {
    currentNetwork,
    isViewingShared,
    isZeroLoginMode,
    leftHeaderItems,
    rightHeaderItems,
  } = useMenuHeader(props)

  const history = useHistory()
  const handleExitSharedMode = () => {
    history.push("/dashboard")
  }

  return (
    <AppHeader title="" showLogo={false}>
      <Box
        direction="row"
        justify="start"
        align="center"
        width="100%"
        overflow="hidden"
      >
        {leftHeaderItems}
        {!isViewingShared && currentNetwork && rightHeaderItems}
        {!isViewingShared && isZeroLoginMode && (
          <Tip content="The full Quailio experience minus the account. Though you won't be storing anything in our database, you can export and import your networks to save your progress.">
            <Text style={{ marginLeft: "auto" }} color="accent-4">
              Zero-login Mode
            </Text>
          </Tip>
        )}

        {/* Shared Mode content */}
        {isViewingShared && (
          <React.Fragment>
            <ToolTipButton
              id="exit-sharing-button"
              tooltip="Return to my Dashboard"
              icon={<Icons.Logout color="accent-1" />}
              onClick={handleExitSharedMode}
              isDisabled={!currentNetwork}
              buttonStyle={{ marginLeft: "auto" }}
            />
            <Tip content="You are viewing a public network.">
              <Text color="accent-4">Shared Mode</Text>
            </Tip>
          </React.Fragment>
        )}
      </Box>
    </AppHeader>
  )
}

export default HeaderMenu
