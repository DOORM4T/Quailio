import { Box, DropButton, List, Menu, Text } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { ActionCreator, AnyAction } from "redux"
import AppHeader from "../../components/containers/AppHeader"
import ToolTipButton from "../../components/ToolTipButton"
import { getNetworkJSON } from "../../firebase/getNetworkJSON"
import useSmallBreakpoint from "../../hooks/useSmallBreakpoint"
import {
  addPerson,
  createNetwork,
  deleteNetwork,
  importNetwork,
  renameNetwork,
  setNetwork,
  setNetworkLoading,
} from "../../store/networks/actions"
import { getAllNetworkData } from "../../store/selectors/networks/getAllNetworkData"
import { getCurrentNetwork } from "../../store/selectors/networks/getCurrentNetwork"

export const HeaderMenu: React.FC = () => {
  const dispatch: ActionCreator<AnyAction> = useDispatch()
  const networks = useSelector(getAllNetworkData)
  const currentNetwork = useSelector(getCurrentNetwork)

  const isSmall = useSmallBreakpoint()

  //                                 //
  // -== ACTION BUTTON FUNCTIONS ==- //
  //                                 //

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
    } catch (error) {
      /* Failed to get the network JSON */
      console.error(error)
    } finally {
      /* Disable network loading */
      await dispatch(setNetworkLoading(false))
    }
  }

  const handleRenameNetwork = async () => {
    /* Stop if no network is selected */
    if (!currentNetwork) return

    /* Prompt the user for the new name */
    const newName = window.prompt(`Rename ${currentNetwork.name} to: `)
    if (!newName) {
      alert("Canceled rename action.")
      return
    }

    // Dispatch to global state
    try {
      await dispatch(renameNetwork(currentNetwork.id, newName))
    } catch (error) {
      console.error(error)
    }
  }

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

  /* Create Network Function */
  const handleCreateNetwork = async () => {
    const networkName = window.prompt("Name your network:")
    if (!networkName) {
      alert("Canceled network creation")
      return
    }

    try {
      await dispatch(createNetwork(networkName))
    } catch (error) {
      console.error(error)
    }
  }

  /* Import Network from JSON Function */
  const handleImportFromJSON = async () => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.multiple = true
    fileInput.accept = ".json"
    fileInput.click()

    /* Wait for the user to upload JSON files */
    fileInput.onchange = async () => {
      if (fileInput.files) {
        try {
          /* Get JSON data from each file */
          const files = Object.values(fileInput.files)
          const getParsedJSON = files.map(async (file) => {
            return JSON.parse(await file.text())
          })

          const data = await Promise.all(getParsedJSON)

          // Import the JSON to global state
          const dispatchImportFunctions = data.map(async (parsedJSON) => {
            return await dispatch(importNetwork(parsedJSON))
          })

          await Promise.all(dispatchImportFunctions)
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  const actionButtons = [
    <ToolTipButton
      key={"add-person-button"}
      id="add-person-button"
      tooltip="Add person"
      ariaLabel="Add a person to the network"
      icon={<Icons.UserAdd color="light-1" />}
      onClick={handleAddPerson}
      isDisabled={!currentNetwork}
    />,

    <ToolTipButton
      key="export-network-json-button"
      id="export-network-json-button"
      tooltip="Export network to JSON"
      ariaLabel="Export the network as a JSON file"
      icon={<Icons.Download color="light-1" />}
      onClick={handleExportToJSON}
      isDisabled={!currentNetwork}
    />,
    <ToolTipButton
      key="import-network-json-button"
      id="import-network-json-button"
      tooltip="Import network from JSON"
      ariaLabel="Import a network from a JSON file"
      icon={<Icons.Upload color="light-1" />}
      onClick={handleImportFromJSON}
    />,

    <ToolTipButton
      key="rename-network-button"
      id="rename-network-button"
      tooltip="Rename current network"
      ariaLabel="Rename the current network"
      icon={<Icons.Tag color="light-1" />}
      onClick={handleRenameNetwork}
      isDisabled={!currentNetwork}
    />,

    <ToolTipButton
      key="delete-network-button"
      id="delete-network-button"
      tooltip="Delete current network"
      ariaLabel="Delete current network"
      icon={<Icons.Threats color="status-critical" />}
      onClick={handleDeleteNetwork}
      isDisabled={!currentNetwork}
    />,
  ]

  const dropContent = networks ? (
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

  return (
    <AppHeader title="" showLogo={false}>
      <Box
        direction="row"
        justify="start"
        align="center"
        width="100%"
        overflow="hidden"
      >
        <Box direction="row" gap="small">
          <ToolTipButton
            id="create-network-button"
            tooltip="Create a new network"
            ariaLabel="Create a new network"
            icon={<Icons.Add color="status-ok" />}
            onClick={handleCreateNetwork}
            buttonStyle={{
              border: "2px solid white",
              borderRadius: "2px",
            }}
          />
          <DropButton
            id="select-network-dropbutton"
            color="accent-1"
            ref={networkSelectRef}
            style={{
              borderRadius: "4px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: "250px",
            }}
            aria-label="Select a network"
            label={
              currentNetwork
                ? `Network: ${currentNetwork.name}`
                : "Select Network"
            }
            dropAlign={{ top: "bottom" }}
            dropContent={dropContent}
            disabled={networks.length === 0}
          />
        </Box>
        {currentNetwork && (
          <Box direction="row" margin={{ left: "auto" }}>
            {isSmall ? (
              <Menu
                icon={
                  <ToolTipButton
                    id="actions-menu"
                    tooltip="Toggle network actions menu"
                    icon={<Icons.Actions />}
                  />
                }
                items={actionButtons.map((btn) => ({ label: btn }))}
              />
            ) : (
              actionButtons.map((btn) => btn)
            )}
          </Box>
        )}
      </Box>
    </AppHeader>
  )
}

export default HeaderMenu
