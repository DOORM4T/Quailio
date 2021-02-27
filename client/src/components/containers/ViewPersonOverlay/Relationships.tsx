import { Anchor, Box, Button, List, Text, TextInput } from "grommet"
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
  const dispatch: Dispatch<any> = useDispatch()
  const currentNetworkId = useSelector(getCurrentNetworkId)
  const currentPersonId = useSelector(getPersonInFocusId)
  const currentPersonRelationships = useSelector(getPersonInFocusRelationships)
  const currentNetworkPeople = useSelector(getCurrentNetworkPeople)

  const [didChangeReason, setDidChangeReason] = React.useState<boolean>(false)

  /* Relationship state based on the selected person */
  const [relatedPeopleData, setRelatedPeopleData] = React.useState<
    IRelatedPersonData[]
  >([])

  /* Update relatedPeopleData state every time the selected person changes */
  React.useEffect(() => {
    /* Stop if there are no relationships */
    if (!currentPersonRelationships) return () => {}

    /* Set state based on related people */
    setRelatedPeopleData(
      getRelatedPeople(currentPersonRelationships, currentNetworkPeople),
    )
  }, [currentPersonRelationships])

  /* Do not render if no network or person is selected */
  if (!currentNetworkId || !currentPersonId) return null

  /* Handle updates to individual relationship reasons, updating relatedPeopleData state */
  const handleReasonChange = (personId: string) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    /* Find the person to update */
    const personToUpdateIndex = relatedPeopleData.findIndex(
      (p) => p.id === personId,
    )
    if (personToUpdateIndex === -1) return

    const personToUpdate = relatedPeopleData[personToUpdateIndex]
    const updatedPerson: IRelatedPersonData = {
      ...personToUpdate,
      reason: e.currentTarget.value,
    }

    /* Update the relatedPeople array */
    const updatedPeople = [...relatedPeopleData]
    updatedPeople[personToUpdateIndex] = updatedPerson

    setRelatedPeopleData(updatedPeople)
    setDidChangeReason(true)
  }

  return (
    <React.Fragment>
      <h3 style={{ textAlign: "center" }}>Connections</h3>
      <List
        id="relationships-list"
        data={relatedPeopleData}
        border={false}
        children={(person: IRelatedPersonData, index: number) => {
          return (
            <Box
              key={`${person.id}-${index}`}
              width="large"
              border={{ side: "bottom" }}
            >
              {
                <Box direction="column">
                  <Anchor
                    className="relationship-anchor"
                    /* Go to the related person's menu when clicked */
                    onClick={async () => {
                      try {
                        /* Ask to continue if there are unsaved changes */
                        const doContinue = fireUnsavedChangeEvent()
                        if (!doContinue) return

                        /* Navigate to the selected person's details */
                        await dispatch(setPersonInFocus(person.id))
                      } catch (error) {
                        console.error(error)
                      }
                    }}
                    label={person.name}
                  />
                  <Box>
                    {props.isEditing ? (
                      // Edit relationship reason
                      <TextInput
                        style={{
                          padding: "0 1rem",
                          border: "none",
                          borderBottom: "1px solid black",
                        }}
                        value={person.reason}
                        onChange={handleReasonChange(person.id)}
                        onFocus={(e) => {
                          /* Highlight all text */
                          e.currentTarget.select()
                        }}
                        onKeyPress={(e) => {
                          if (/(Enter|Escape)/.test(e.key))
                            e.currentTarget.blur()
                        }}
                        onBlur={async (e) => {
                          /* Stop if the relationship reason didn't change */
                          if (!didChangeReason) return

                          /* Update the relationship */
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
                        }}
                      />
                    ) : (
                      // Display read-only relationship reason
                      <Text
                        size="medium"
                        style={{
                          fontStyle: "italic",
                        }}
                      >
                        {person.reason || "-"}
                      </Text>
                    )}
                  </Box>
                </Box>
              }
            </Box>
          )
        }}
        action={(otherPerson: IRelatedPersonData) => {
          if (!props.isEditing) return null
          return (
            <Button
              className="delete-connection-button"
              key={`delete-connection-${otherPerson.id}`}
              aria-label="Delete connection"
              icon={<Icons.Unlink color="status-critical" />}
              hoverIndicator
              onClick={async () => {
                /* Delete a relationship with the other person*/
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
              }}
            />
          )
        }}
      />
    </React.Fragment>
  )
}

/* Get the array of people related to the selected person */
function getRelatedPeople(
  personRelationships: IRelationships,
  currentNetworkPeople: IPerson[],
): IRelatedPersonData[] {
  return (
    (Object.keys(personRelationships)
      .map((relationshipId) => {
        /* Get relationship details */
        const [thisPersonReason, otherPersonReason] = personRelationships[
          relationshipId
        ]

        /* Find people related to the selected person */
        const otherPerson = currentNetworkPeople.find(
          (p) => p.id === relationshipId,
        )
        if (!otherPerson) return null

        /* Create OtherPersonData object */
        return {
          id: otherPerson.id,
          name: otherPerson.name,
          reason: otherPersonReason,
        }
      })
      /* Remove null items */
      .filter((item) => item !== null) as IRelatedPersonData[]).sort((p1, p2) =>
      p1.name.localeCompare(p2.name),
    )
  )
}

export default Relationships
