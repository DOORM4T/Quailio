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
import { useDispatch } from "react-redux"
import { fireUnsavedChangeEvent } from "../../../helpers/unsavedChangeEvent"
import {
  connectPeople,
  deletePerson as deletePersonById,
  disconnectPeople,
} from "../../../store/networks/actions"
import { ICurrentNetwork, IPerson } from "../../../store/networks/networkTypes"
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
  currentNetwork: ICurrentNetwork
  currentPerson: IPerson
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}
const OverlayButtons: React.FC<IOverlayButtonProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()

  /* Do not render if no network or person are selected */
  if (!props.currentNetwork || !props.currentPerson) return null

  /* IDs of people related to the selected person */
  const currentRelationshipIds: string[] = Object.keys(
    props.currentPerson.relationships,
  )

  /* List of possible people to connect to */
  // TODO: Change into a (multi-?)select menu
  const relationshipOptions = props.currentNetwork.people
    .map((p) => {
      /* Exclude already-related people */
      const isAlreadyRelated = currentRelationshipIds.includes(p.id)
      const isSelf = p.id === props.currentPerson.id
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
          connectPeople(props.currentNetwork.id, {
            p1Id: props.currentPerson.id,
            p2Id: id,
          }),
        )
      } else {
        // Remove connection
        await dispatch(
          disconnectPeople(props.currentNetwork.id, {
            p1Id: props.currentPerson.id,
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
    if (!props.currentNetwork) return

    /* Confirm deletion */
    const doDelete = window.confirm(
      `Delete ${props.currentPerson.name}? This action cannot be reversed.`,
    )
    if (!doDelete) return

    /* Close the Person overlay */
    dispatch(togglePersonEditMenu(false))

    /* Delete the person */
    try {
      await dispatch(deletePersonById(props.currentNetwork.id, id))
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Box direction="row">
      {props.isEditing ? (
        // Toggle view mode
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
      ) : (
        // Toggle edit mode
        <Button
          id="edit-button"
          icon={<Icons.Edit color="neutral-3" />}
          aria-label="Edit information"
          hoverIndicator
          onClick={() => props.setIsEditing(true)}
        />
      )}
      {props.isEditing && (
        <React.Fragment>
          {/* Connect to another person */}
          <DropButton
            id="add-relationship-dropdown"
            icon={<Icons.Connect color="neutral-3" />}
            aria-label="Create connection"
            hoverIndicator
            dropAlign={{ left: "right" }}
            dropContent={
              <React.Fragment>
                <Heading level={4} textAlign="center">
                  Manage Connections
                </Heading>

                {/* TODO: Search for people by name */}
                <TextInput
                  placeholder="Search by name (Coming Soon)"
                  disabled
                />

                <List
                  id="add-relationship-buttons"
                  primaryKey="name"
                  data={relationshipOptions}
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

          {/* Delete the person */}
          <Button
            id="delete-person-button"
            icon={<Icons.Trash color="status-critical" />}
            aria-label="Delete person"
            hoverIndicator
            onClick={deletePerson(props.currentPerson.id)}
          />
        </React.Fragment>
      )}
    </Box>
  )
}

export default OverlayButtons
