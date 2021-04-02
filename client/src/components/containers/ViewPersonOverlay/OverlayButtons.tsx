import { Box, Button, DropButton, Heading, Tip } from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fireUnsavedChangeEvent } from "../../../helpers/unsavedChangeEvent"
import {
  connectPeople,
  deletePerson as deletePersonById,
  disconnectPeople,
} from "../../../store/networks/actions"
import { togglePersonInGroup } from "../../../store/networks/actions/togglePersonInGroup"
import { IRelationships } from "../../../store/networks/networkTypes"
import {
  getCurrentNetworkGroups,
  getCurrentNetworkId,
  getCurrentNetworkPeople,
} from "../../../store/selectors/networks/getCurrentNetwork"
import {
  getPersonInFocusId,
  getPersonInFocusName,
  getPersonInFocusRelationships,
} from "../../../store/selectors/ui/getPersonInFocusData"
import { togglePersonOverlay } from "../../../store/ui/uiActions"
import SearchAndCheckMenu from "../../SearchAndCheckMenu"
import ToolTipButton from "../../ToolTipButton"

//                 //
// -== BUTTONS ==- //
//                 //
interface IRelationshipOption {
  id: string
  name: string
  isConnected: boolean
  currentRelationships: IRelationships
}

interface IOverlayButtonProps {
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}
const OverlayButtons: React.FC<IOverlayButtonProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const currentNetworkId = useSelector(getCurrentNetworkId)
  const currentPersonId = useSelector(getPersonInFocusId)
  const currentPersonRelationships = useSelector(getPersonInFocusRelationships)
  const currentPersonName = useSelector(getPersonInFocusName)
  const currentNetworkPeople = useSelector(getCurrentNetworkPeople)
  const currentNetworkGroups = useSelector(getCurrentNetworkGroups)
  const groupsWithId = Object.entries(currentNetworkGroups).map((entry) => ({
    ...entry[1],
    id: entry[0],
  }))

  // Connection drop-button ref -- used to trigger a click to close the menu
  const connectPeopleDropButtonRef = React.useRef<any>()
  const handleCloseConnectionMenu = () => {
    if (!connectPeopleDropButtonRef) return
    const btn = connectPeopleDropButtonRef.current as HTMLButtonElement
    btn.click()
    setTimeout(() => {
      btn.blur()
    }, 10)
  }

  // Groups drop-button ref -- used to trigger a click to close the menu
  const manageGroupsDropButtonRef = React.useRef<any>()
  const handleCloseGroupsMenu = () => {
    if (!manageGroupsDropButtonRef) return
    const btn = manageGroupsDropButtonRef.current as HTMLButtonElement
    btn.click()
    setTimeout(() => {
      btn.blur()
    }, 10)
  }

  /* Do not render if no network or person is selected */
  if (!currentNetworkId || !currentPersonId) return null

  /**
   * Delete a person by their ID
   * @param id
   */
  const deletePerson = (id: string) => async () => {
    /* Confirm deletion */
    const doDelete = window.confirm(
      `Delete ${currentPersonName}? This action cannot be reversed.`,
    )
    if (!doDelete) return

    /* Close the Person overlay */
    dispatch(togglePersonOverlay(false))

    /* Delete the person */
    try {
      await dispatch(deletePersonById(currentNetworkId, id))
    } catch (error) {
      console.error(error)
    }
  }

  // Button for entering view mode
  const viewModeButton: React.ReactNode = (
    <ToolTipButton
      tooltip="View mode"
      icon={<Icons.View color="status-ok" />}
      aria-label="Viewer mode"
      onClick={() => {
        /* If there are unsaved changes, ask the user to confirm before switching modes */
        const doContinue = fireUnsavedChangeEvent()
        if (!doContinue) return

        /* Switch away from edit mode to view mode */
        props.setIsEditing(false)
      }}
    />
  )

  // Button for entering edit mode
  const editModeButton: React.ReactNode = (
    <ToolTipButton
      tooltip="Edit mode"
      id="edit-button"
      icon={<Icons.Edit color="neutral-3" />}
      aria-label="Edit information"
      onClick={() => props.setIsEditing(true)}
    />
  )

  // Button for deleting the current person
  const deleteCurrentPersonButton: React.ReactNode = (
    <ToolTipButton
      tooltip="Delete"
      id="delete-person-button"
      icon={<Icons.Trash color="status-critical" />}
      aria-label="Delete person"
      onClick={deletePerson(currentPersonId)}
    />
  )

  /* IDs of people related to the selected person */
  const currentRelationshipIds: string[] = currentPersonRelationships
    ? Object.keys(currentPersonRelationships)
    : []

  /* List of possible people to connect to */
  const relationshipOptions = currentNetworkPeople
    .map((p) => {
      /* Exclude already-related people */
      const isAlreadyRelated = currentRelationshipIds.includes(p.id)
      const isSelf = p.id === currentPersonId
      if (!isSelf) {
        const relOption: IRelationshipOption = {
          id: p.id,
          name: p.name,
          isConnected: isAlreadyRelated,
          currentRelationships: p.relationships,
        }
        return relOption
      } else {
        return {}
      }
    })
    .filter((item) => {
      /* Exclude empty entries */
      const hasData = Object.keys(item).length !== 0
      return hasData
    }) as IRelationshipOption[]

  const toggleConnection = (id: string, isConnected: boolean) => async () => {
    // Connect to the person the current person is not already connected to them
    const doConnect = !isConnected

    try {
      // Add connection
      if (doConnect) {
        await dispatch(
          connectPeople(currentNetworkId, {
            p1Id: currentPersonId,
            p2Id: id,
          }),
        )
      } else {
        // Remove connection
        await dispatch(
          disconnectPeople(currentNetworkId, {
            p1Id: currentPersonId,
            p2Id: id,
          }),
        )
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Button that opens a menu for connecting to/disconnecting from other people
  const ConnectPeopleDropButton: React.ReactNode = (
    <Tip content="Manage connections">
      <DropButton
        id="manage-relationships-drop-button"
        icon={<Icons.Connect color="neutral-3" />}
        aria-label="Create connection"
        hoverIndicator
        dropAlign={{ left: "right" }}
        ref={connectPeopleDropButtonRef}
        dropContent={
          <React.Fragment>
            <Box direction="row" justify="center">
              <Heading level={4} margin={{ left: "auto" }} textAlign="center">
                Manage Connections
              </Heading>
              <Button
                onClick={handleCloseConnectionMenu}
                icon={<Icons.Close />}
                aria-label="Close connection management menu"
                margin={{ left: "auto" }}
                hoverIndicator
              />
            </Box>
            <SearchAndCheckMenu
              defaultOptions={relationshipOptions}
              idField="id"
              nameField="name"
              isCheckedFunction={(arg: IRelationshipOption) => arg.isConnected}
              toggleOption={toggleConnection}
              maxHeight="350px"
            />
          </React.Fragment>
        }
      />
    </Tip>
  )

  const isPersonInGroup = (groupWithId: typeof groupsWithId[0]) =>
    groupWithId.personIds.includes(currentPersonId)

  const toggleGroup = (id: string, isInGroup: boolean) => async () => {
    // Add to the group if they're not already in it
    const doGroup = !isInGroup

    try {
      // Toggle the person in the group in global state using a custom Redux action
      await dispatch(
        togglePersonInGroup(currentNetworkId, id, currentPersonId, doGroup),
      )
    } catch (error) {
      console.error(error)
    }
  }

  // Button that opens a menu for managing the current person's groups
  const ManageGroupsDropButton: React.ReactNode = (
    <Tip content="Manage groups">
      <DropButton
        id="manage-groups-drop-button"
        icon={<Icons.Group color="accent-1" />}
        aria-label="Manage groups"
        hoverIndicator
        dropAlign={{ left: "right" }}
        ref={manageGroupsDropButtonRef}
        dropContent={
          <React.Fragment>
            <Box direction="row" justify="center">
              <Heading level={4} margin={{ left: "auto" }} textAlign="center">
                Manage Groups
              </Heading>
              <Button
                onClick={handleCloseGroupsMenu}
                icon={<Icons.Close />}
                aria-label="Close group management menu"
                margin={{ left: "auto" }}
                hoverIndicator
              />
            </Box>
            <SearchAndCheckMenu
              defaultOptions={groupsWithId}
              idField="id"
              nameField="name"
              isCheckedFunction={isPersonInGroup}
              toggleOption={toggleGroup}
              itemBgColorField="backgroundColor"
              itemTextColorField="textColor"
              pad="small"
              maxHeight="350px"
            />
          </React.Fragment>
        }
      />
    </Tip>
  )

  return (
    <Box direction="row">
      {props.isEditing ? (
        // Edit Mode
        <React.Fragment>
          {viewModeButton}
          {ConnectPeopleDropButton}
          {ManageGroupsDropButton}
          {deleteCurrentPersonButton}
        </React.Fragment>
      ) : (
        // View Mode
        <React.Fragment>{editModeButton}</React.Fragment>
      )}
    </Box>
  )
}

export default OverlayButtons
