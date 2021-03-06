import {
  Box,
  Button,
  CheckBox,
  DropButton,
  Heading,
  List,
  Text,
  TextInput,
} from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fireUnsavedChangeEvent } from "../../../helpers/unsavedChangeEvent"
import {
  connectPeople,
  deletePerson as deletePersonById,
  disconnectPeople,
} from "../../../store/networks/actions"
import {
  getCurrentNetworkId,
  getCurrentNetworkPeople,
} from "../../../store/selectors/networks/getCurrentNetwork"
import {
  getPersonInFocusId,
  getPersonInFocusName,
  getPersonInFocusRelationships,
} from "../../../store/selectors/ui/getPersonInFocusData"
import { togglePersonEditMenu } from "../../../store/ui/uiActions"

//                 //
// -== BUTTONS ==- //
//                 //
interface IRelationshipOption {
  id: string
  name: string
  isConnected: boolean
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

  // Connection drop-button search state
  const [search, setSearch] = React.useState<string>("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value)
  }

  // Connection drop-button ref -- used to trigger a click to close the menu
  const connectPeopleDropButtonRef = React.useRef<any>()

  const handleCloseConnectionMenu = () => {
    if (!connectPeopleDropButtonRef) return
    const btn = connectPeopleDropButtonRef.current as HTMLButtonElement
    btn.click()
  }

  /* Do not render if no network or person is selected */
  if (!currentNetworkId || !currentPersonId) return null

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
        return { id: p.id, name: p.name, isConnected: isAlreadyRelated }
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
    dispatch(togglePersonEditMenu(false))

    /* Delete the person */
    try {
      await dispatch(deletePersonById(currentNetworkId, id))
    } catch (error) {
      console.error(error)
    }
  }

  // Button for entering view mode
  const viewModeButton: React.ReactNode = (
    <Button
      icon={<Icons.View color="status-ok" />}
      aria-label="Viewer mode"
      hoverIndicator
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
    <Button
      id="edit-button"
      icon={<Icons.Edit color="neutral-3" />}
      aria-label="Edit information"
      hoverIndicator
      onClick={() => props.setIsEditing(true)}
    />
  )

  // Button for deleting the current person
  const deleteCurrentPersonButton: React.ReactNode = (
    <Button
      id="delete-person-button"
      icon={<Icons.Trash color="status-critical" />}
      aria-label="Delete person"
      hoverIndicator
      onClick={deletePerson(currentPersonId)}
    />
  )

  // Button that opens a menu for connecting to/disconnecting from other people
  const ConnectPeopleDropButton: React.ReactNode = (
    <DropButton
      id="add-relationship-dropdown"
      icon={<Icons.Connect color="neutral-3" />}
      aria-label="Create connection"
      hoverIndicator
      dropAlign={{ left: "right" }}
      ref={connectPeopleDropButtonRef}
      dropContent={
        <React.Fragment>
          <Box direction="row" justify="center" pad="xsmall">
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

          <TextInput
            placeholder="Search by name"
            value={search}
            onChange={handleSearchChange}
          />
          <List
            id="add-relationship-buttons"
            primaryKey="name"
            data={relationshipOptions.filter((r) =>
              r.name.toLowerCase().includes(search.toLowerCase()),
            )}
            style={{ maxHeight: "350px", overflowY: "auto" }}
          >
            {(data: IRelationshipOption) => (
              <Box
                direction="row"
                key={data.id}
                gap="small"
                width="medium"
                onClick={toggleConnection(data.id, data.isConnected)}
              >
                <Text>{data.name}</Text>
                <Box margin={{ left: "auto" }}>
                  <CheckBox checked={data.isConnected} />
                </Box>
              </Box>
            )}
          </List>
        </React.Fragment>
      }
    />
  )

  return (
    <Box direction="row">
      {props.isEditing ? (
        // Edit Mode
        <React.Fragment>
          {viewModeButton}
          {ConnectPeopleDropButton}
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
