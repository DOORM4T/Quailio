import { Anchor, Box, Button, List, Text, TextInput } from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch } from "react"
import { useDispatch } from "react-redux"
import { fireUnsavedChangeEvent } from "../../../helpers/unsavedChangeEvent"
import {
  disconnectPeople,
  updateRelationshipReason,
} from "../../../store/networks/networksActions"
import { ICurrentNetwork, IPerson } from "../../../store/networks/networkTypes"
import { setPersonInFocus } from "../../../store/ui/uiActions"
import { IPersonInFocus } from "../../../store/ui/uiTypes"

interface IRelatedPersonData {
  id: string
  name: string
  reason: string
}

interface IRelationshipsProps {
  currentNetwork: ICurrentNetwork
  currentPerson: IPersonInFocus
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}

const Relationships: React.FC<IRelationshipsProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const [didChangeReason, setDidChangeReason] = React.useState<boolean>(false)

  /* Relationship state based on the selected person */
  const [relatedPeopleData, setRelatedPeopleData] = React.useState<
    IRelatedPersonData[]
  >([])

  /* Update relatedPeopleData state every time the selected person changes */
  React.useEffect(() => {
    if (!props.currentPerson) return
    setRelatedPeopleData(
      getRelatedPeople(props.currentPerson, props.currentNetwork),
    )
  }, [props.currentPerson])

  /* Handle updates to individual relationship reasons, updating relatedPeopleData state */
  const handleReasonChange = (personId: string) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    /* Find the person to update */
    const personToUpdate = relatedPeopleData.find((p) => p.id === personId)
    if (!personToUpdate) return

    /* Update their relationship reason */
    const updatedPerson: IRelatedPersonData = {
      ...personToUpdate,
      reason: e.currentTarget.value,
    }

    /* Update the relatedPeople array */
    const peopleWithoutUpdated = relatedPeopleData.filter(
      (p) => p.id !== personId,
    )
    const updatedPeople = peopleWithoutUpdated
      .concat(updatedPerson)
      .sort((a, b) => a.name.localeCompare(b.name))

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
                        props.setIsEditing(false)
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
                          /* Update the relationship */
                          try {
                            await dispatch(
                              updateRelationshipReason(
                                props.currentPerson.id,
                                person.id,
                                e.currentTarget.value,
                              ),
                            )

                            /* Get the updated details */
                            await dispatch(
                              setPersonInFocus(props.currentPerson.id),
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
                /* Ask to continue if there are unsaved changes */
                const doContinue = fireUnsavedChangeEvent()
                if (!doContinue) return

                /* Delete a relationship with the other person*/
                try {
                  await dispatch(
                    disconnectPeople(props.currentNetwork.id, {
                      p1Id: props.currentPerson.id,
                      p2Id: otherPerson.id,
                    }),
                  )

                  /* Get updated current person data */
                  await dispatch(setPersonInFocus(props.currentPerson.id))
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
  person: IPerson | null,
  currentNetwork: ICurrentNetwork | null,
): IRelatedPersonData[] {
  if (!person || !currentNetwork) return []

  return (
    (Object.keys(person.relationships)
      .map((relationshipId) => {
        /* Get relationship details */
        const [thisPersonReason, otherPersonReason] = person.relationships[
          relationshipId
        ]

        /* Find people related to the selected person */
        const otherPerson = currentNetwork.people.find(
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
