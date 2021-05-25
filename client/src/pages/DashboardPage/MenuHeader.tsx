import { Box, Text, Tip } from "grommet"
import React from "react"
import AppHeader from "../../components/containers/AppHeader"
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
    isViewingShared,
    isZeroLoginMode,
    leftHeaderItems,
    rightHeaderItems,
  } = useMenuHeader(props)

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
        {rightHeaderItems}
        {!isViewingShared && isZeroLoginMode && (
          <Tip content="The full Quailio experience minus the account. Though you won't be storing anything in our database, you can export and import your networks to save your progress.">
            <Text style={{ marginLeft: "auto" }} color="accent-4">
              Zero-login Mode
            </Text>
          </Tip>
        )}

        {isViewingShared && (
          <Tip content="You are viewing a public network.">
            <Text color="accent-4">Shared Mode</Text>
          </Tip>
        )}
      </Box>
    </AppHeader>
  )
}

export default HeaderMenu
