import { Anchor, Box, Button, Heading, List, Text, TextInput } from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fireUnsavedChangeEvent } from "../../../helpers/unsavedChangeEvent"
import {
  disconnectPeople,
  updateRelationshipReason,
} from "../../../store/networks/actions"
import { IPerson, IRelationships } from "../../../store/networks/networkTypes"
import {
  getCurrentNetworkId,
  getCurrentNetworkPeople,
} from "../../../store/selectors/networks/getCurrentNetwork"
import {
  getPersonInFocusId,
  getPersonInFocusRelationships,
} from "../../../store/selectors/ui/getPersonInFocusData"
import { setPersonInFocus } from "../../../store/ui/uiActions"

// Specific data to display for a person related to the current person
interface IRelatedPersonData {
  id: string
  name: string
  reason: string
}

interface IRelationshipsProps {
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}

const Relationships: React.FC<IRelationshipsProps> = (props) => {
  //
  // #region Hooks
  //
  const dispatch: Dispatch<any> = useDispatch()
  const currentNetworkId = useSelector(getCurrentNetworkId)
  const currentPersonId = useSelector(getPersonInFocusId)
  const currentPersonRelationships = useSelector(getPersonInFocusRelationships)
  const currentNetworkPeople = useSelector(getCurrentNetworkPeople)

  const [didChangeReason, setDidChangeReason] = React.useState<boolean>(false)
  const [relatedPeopleData, setRelatedPeopleData] = React.useState<
    IRelatedPersonData[]
  >([])

  // Update relatedPeopleData state every time the selected person changes
  React.useEffect(() => {
    if (!currentPersonRelationships) return

    const relatedPeople = getRelatedPeople(
      currentPersonRelationships,
      currentNetworkPeople,
    )
    setRelatedPeopleData(relatedPeople)
  }, [currentPersonRelationships])

  //
  // #endregion Hooks
  //

  // Do not render if no network or person is selected
  if (!currentNetworkId || !currentPersonId) return null

  //
  // #region Relationships List
  //
  // Handle updates to individual relationship reasons
  const handleReasonChange = (personId: string) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const updatedRelatedPeople = getUpdatedRelatedPeople()
    if (!updatedRelatedPeople) return

    setRelatedPeopleData(updatedRelatedPeople)
    setDidChangeReason(true)

    // #region handleReasonChange: HELPERS
    function getUpdatedRelatedPeople(): IRelatedPersonData[] | null {
      const personToUpdateIndex = relatedPeopleData.findIndex(
        (p) => p.id === personId,
      )
      if (personToUpdateIndex === -1) return null

      const personToUpdate = relatedPeopleData[personToUpdateIndex]
      const updatedPerson: IRelatedPersonData = {
        ...personToUpdate,
        reason: e.currentTarget.value,
      }

      /* Update the relatedPeople array */
      const updatedPeople = [...relatedPeopleData]
      updatedPeople[personToUpdateIndex] = updatedPerson

      return updatedPeople
    }

    // #endregion handleReasonChange: HELPERS
  }

  const renderListItem = (person: IRelatedPersonData, index: number) => {
    const navigateToRelatedPerson = async () => {
      try {
        /* Ask to continue if there are unsaved changes */
        const doContinue = fireUnsavedChangeEvent()
        if (!doContinue) return

        /* Navigate to the selected person's details */
        await dispatch(setPersonInFocus(person.id))
      } catch (error) {
        console.error(error)
      }
    }

    const blurOnEnterOrEsc = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (/(Enter|Escape)/.test(e.key)) e.currentTarget.blur()
    }

    const updateRelReason = async (e: React.FocusEvent<HTMLInputElement>) => {
      if (!didChangeReason) return

      try {
        await dispatch(
          updateRelationshipReason(
            currentPersonId,
            person.id,
            e.currentTarget.value,
          ),
        )
      } catch (error) {
        console.error(error)
      }
      setDidChangeReason(false)
    }

    const relationshipReasonEditor = (
      <TextInput
        style={{
          padding: "0 1rem",
          border: "none",
          borderBottom: "1px solid black",
        }}
        value={person.reason}
        onChange={handleReasonChange(person.id)}
        onKeyPress={blurOnEnterOrEsc}
        onBlur={updateRelReason}
      />
    )

    const readOnlyRelReason = (
      <Text
        size="medium"
        style={{
          fontStyle: "italic",
        }}
      >
        {person.reason || "-"}
      </Text>
    )

    const relatedPersonNameAnchor = (
      <Anchor
        className="relationship-anchor"
        onClick={navigateToRelatedPerson}
        label={person.name}
      />
    )

    const relationshipContent = (
      <Box>
        {props.isEditing ? relationshipReasonEditor : readOnlyRelReason}
      </Box>
    )

    return (
      <Box
        key={`${person.id}-${index}`}
        width="large"
        border={{ side: "bottom" }}
      >
        {
          <Box direction="column">
            {relatedPersonNameAnchor}
            {relationshipContent}
          </Box>
        }
      </Box>
    )
  }

  const listItemAction = (otherPerson: IRelatedPersonData) => {
    if (!props.isEditing) return null

    const destroyRelationship = async () => {
      try {
        await dispatch(
          disconnectPeople(currentNetworkId, {
            p1Id: currentPersonId,
            p2Id: otherPerson.id,
          }),
        )
      } catch (error) {
        console.error(error)
      }
    }

    return (
      <Button
        className="delete-connection-button"
        key={`delete-connection-${otherPerson.id}`}
        aria-label="Delete connection"
        icon={<Icons.Unlink color="status-critical" />}
        hoverIndicator
        onClick={destroyRelationship}
      />
    )
  }
  //
  // #endregion Relationships List
  //

  return (
    <React.Fragment>
      <Heading level={3} textAlign="center">
        Connections
      </Heading>
      <List
        id="relationships-list"
        data={relatedPeopleData}
        border={false}
        children={renderListItem}
        action={listItemAction}
      />
    </React.Fragment>
  )
}

function getRelatedPeople(
  personRelationships: IRelationships,
  currentNetworkPeople: IPerson[],
): IRelatedPersonData[] {
  const relationshipIds = Object.keys(personRelationships)
  const relatedPeople = relationshipIds
    .map(relIdToRelPerson)
    .filter(nonNull) as IRelatedPersonData[]

  return relatedPeople.sort(alphanumericSort)

  //
  // #region getRelatedPeople: HELPERS
  //
  function relIdToRelPerson(relationshipId: string): IRelatedPersonData | null {
    const otherPerson = currentNetworkPeople.find(
      (p) => p.id === relationshipId,
    )
    if (!otherPerson) return null

    const reason = personRelationships[relationshipId].reason || ""

    return {
      id: otherPerson.id,
      name: otherPerson.name,
      reason,
    }
  }

  function nonNull(item: IRelatedPersonData | null) {
    return item !== null
  }

  function alphanumericSort(p1: IRelatedPersonData, p2: IRelatedPersonData) {
    return p1.name.localeCompare(p2.name)
  }

  //
  //#endregion getRelatedPeople: HELPERS
  //
}

export default Relationships
