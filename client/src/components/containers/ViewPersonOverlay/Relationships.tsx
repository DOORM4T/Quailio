import { Anchor, Box, Button, Heading, List, Text, TextArea } from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fireUnsavedChangeEvent } from "../../../helpers/unsavedChangeEvent"
import {
  disconnectPeople,
  setRelationshipShape,
  updateRelationshipReason,
} from "../../../store/networks/actions"
import {
  ConnectionShape,
  IPerson,
  IRelationships,
} from "../../../store/networks/networkTypes"
import {
  getCurrentNetworkId,
  getCurrentNetworkPeople,
} from "../../../store/selectors/networks/getCurrentNetwork"
import {
  getPersonInFocusId,
  getPersonInFocusRelationships,
} from "../../../store/selectors/ui/getPersonInFocusData"
import { setPersonInFocus } from "../../../store/ui/uiActions"
import ToolTipButton from "../../ToolTipButton"

// Specific data to display for a person related to the current person
interface IRelatedPersonData {
  id: string
  name: string
  reason: string
  relationshipId: string
  lineEndingShape: ConnectionShape
}

interface IRelationshipsProps {
  isEditing: boolean
}

const Relationships: React.FC<IRelationshipsProps> = ({ isEditing }) => {
  //
  // #region Hooks
  //
  const dispatch: Dispatch<any> = useDispatch()

  /* We use memoized selectors here instead of current network or person props to...
      -prevent fields like unsaved person content from resetting when a relationship changes
      -prevent the connections & groups checklist menus from closing whenever one item is clicked (which is not fun) */
  const currentNetworkId = useSelector(getCurrentNetworkId)
  const currentPersonId = useSelector(getPersonInFocusId)
  const relationships = useSelector(getPersonInFocusRelationships)
  const currentNetworkPeople = useSelector(getCurrentNetworkPeople)

  const [didChangeReason, setDidChangeReason] = React.useState<boolean>(false)
  const [relatedPeopleData, setRelatedPeopleData] = React.useState<
    IRelatedPersonData[]
  >([])

  // Update relatedPeopleData state every time the selected person changes
  React.useEffect(() => {
    if (!relationships) return

    const relatedPeople = getRelatedPeople(relationships, currentNetworkPeople)
    setRelatedPeopleData(relatedPeople)
  }, [relationships])

  //
  // #endregion Hooks
  //

  // Don't render if no network or person is selected
  if (!currentNetworkId || !currentPersonId) return null

  //
  // #region Relationships List
  //
  // Handle updates to individual relationship reasons
  const handleReasonChange =
    (personId: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

    const updateRelReason = async (
      e: React.FocusEvent<HTMLTextAreaElement>,
    ) => {
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
      <TextArea
        resize={false}
        style={{
          width: "100%",
          border: "none",
          borderBottom: "1px solid black",
        }}
        value={person.reason}
        onChange={handleReasonChange(person.id)}
        onBlur={updateRelReason}
      />
    )

    const readOnlyRelReason = (
      <Text
        size="medium"
        style={{
          fontStyle: "italic",
          wordWrap: "break-word",
          whiteSpace: "break-spaces",
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
      <Box>{isEditing ? relationshipReasonEditor : readOnlyRelReason}</Box>
    )

    const pickShape = (shape: ConnectionShape) => async () => {
      if (person.lineEndingShape === shape) return

      try {
        await dispatch(
          setRelationshipShape(
            currentNetworkId,
            currentPersonId,
            person.relationshipId,
            shape,
          ),
        )
      } catch (error) {
        console.error(error)
      }
    }

    const shapeHighlight = (shape: ConnectionShape) =>
      person.lineEndingShape === shape ? "status-ok" : "status-disabled"

    const shapeButtons = (
      <Box direction="column">
        <ToolTipButton
          onClick={pickShape("none")}
          icon={<Icons.Clear size="16px" color={shapeHighlight("none")} />}
          tooltip="No line ending"
          buttonStyle={{
            height: "16px",
          }}
        />
        <ToolTipButton
          onClick={pickShape("arrow")}
          icon={<Icons.CaretNext size="16px" color={shapeHighlight("arrow")} />}
          tooltip="Arrow line ending"
          buttonStyle={{ height: "16px" }}
        />
      </Box>
    )

    return (
      <Box
        key={`${person.id}-${index}`}
        width="large"
        border={{ side: "bottom" }}
        direction="row"
      >
        {isEditing && shapeButtons}
        {
          <Box
            direction="column"
            style={{
              width: "calc(100%)",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              display: "inline-block",
            }}
          >
            {relatedPersonNameAnchor}
            <Box pad="4px">{relationshipContent}</Box>
          </Box>
        }
      </Box>
    )
  }

  const listItemAction = (otherPerson: IRelatedPersonData) => {
    if (!isEditing) return null

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

    const relationship = personRelationships[relationshipId]
    const reason = relationship.reason || ""
    const lineEndingShape: ConnectionShape = relationship.shape || "none"

    return {
      id: otherPerson.id,
      name: otherPerson.name,
      reason,
      relationshipId,
      lineEndingShape,
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
