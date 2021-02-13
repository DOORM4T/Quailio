import { Box, Button, DropButton, Heading, List } from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch } from "react"
import { useDispatch } from "react-redux"
import { fireUnsavedChangeEvent } from "../../../helpers/unsavedChangeEvent"
import { connectPeople } from "../../../store/networks/actions/connectPeople"
import { deletePerson as deletePersonById } from "../../../store/networks/actions/deletePerson"
import { getAllPeople } from "../../../store/networks/actions/getAllPeople"
import { ICurrentNetwork } from "../../../store/networks/networkTypes"
import {
  setPersonInFocus,
  togglePersonEditMenu,
} from "../../../store/ui/uiActions"
import { IPersonInFocus } from "../../../store/ui/uiTypes"

//                 //
// -== BUTTONS ==- //
//                 //
interface IOverlayButtonProps {
  currentNetwork: ICurrentNetwork
  currentPerson: IPersonInFocus
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
  const relationshipOptions = props.currentNetwork.people
    .map((p) => {
      /* Exclude already-related people */
      const isAlreadyRelated = currentRelationshipIds.includes(p.id)
      const isSelf = p.id === props.currentPerson.id
      if (!isAlreadyRelated && !isSelf) {
        return { id: p.id, name: p.name }
      } else {
        return {}
      }
    })
    .filter((item) => {
      /* Exclude empty entries */
      const hasData = Object.keys(item).length !== 0
      return hasData
    })

  const connectToPerson = async (event: { item?: {} | undefined }) => {
    const otherPerson = event.item as { id: string; name: string }

    const p1Reason =
      prompt(
        `${props.currentPerson.name}'s relationship to ${otherPerson.name}:`,
      ) || ""
    const p2Reason =
      prompt(
        `${otherPerson.name}'s relationship to ${props.currentPerson.name}:`,
      ) || ""

    const p1Id = props.currentPerson.id
    const p2Id = otherPerson.id

    try {
      await dispatch(
        connectPeople(props.currentNetwork.id, {
          p1Id,
          p2Id,
          p1Reason,
          p2Reason,
        }),
      )

      /* Load updated data */
      await dispatch(setPersonInFocus(props.currentPerson.id))
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
      await dispatch(getAllPeople(props.currentNetwork.id))
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
            dropContent={
              <React.Fragment>
                <Heading level={4} textAlign="center" color="">
                  Connect with:
                </Heading>
                <List
                  id="add-relationship-buttons"
                  primaryKey="name"
                  onClickItem={connectToPerson}
                  data={relationshipOptions}
                />
              </React.Fragment>
            }
            dropAlign={{ top: "bottom" }}
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
