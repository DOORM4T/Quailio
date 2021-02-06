import {
  Accordion,
  AccordionPanel,
  Anchor,
  Box,
  Button,
  DropButton,
  Heading,
  Image,
  List,
  Text,
  TextInput,
} from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { personContentCollection } from "../../firebase"
import {
  connectPeople,
  deletePerson as deletePersonById,
  disconnectPeople,
  getAllPeople,
  setPersonThumbnail,
  updateRelationshipReason,
} from "../../store/networks/networksActions"
import { ICurrentNetwork, IPerson } from "../../store/networks/networkTypes"
import { IApplicationState } from "../../store/store"
import {
  setPersonContent,
  setPersonInFocus,
  togglePersonEditMenu,
} from "../../store/ui/uiActions"
import { IPersonInFocus } from "../../store/ui/uiTypes"
import ContentEditor from "../ContentEditor"
import SplitOverlay from "../SplitOverlay"

interface IProps {
  [key: string]: any
}

const ViewPersonOverlay: React.FC<IProps> = (props) => {
  // -== GLOBAL STORE HOOKS ==- //
  const dispatch: Dispatch<any> = useDispatch()

  /* Get all people in the current network */
  const currentNetwork = useSelector<IApplicationState, ICurrentNetwork | null>(
    (state) => state.networks.currentNetwork,
  )

  /* Get the current person in focus */
  const person = useSelector<IApplicationState, IPersonInFocus | null>(
    (state) => state.ui.personInFocus,
  )

  // -== LOCAL STATE & OTHER HOOKS ==- //
  const [isEditing, setIsEditing] = React.useState(false) // Whether the overlay is in edit mode or not
  const thumbnailUploadRef = React.useRef<HTMLInputElement>(null) // Reference to the thumbnail file input DOM element

  /* Relationship state based on the selected person */
  const [relatedPeopleData, setRelatedPeopleData] = React.useState<
    IRelatedPersonData[]
  >(getRelatedPeople(person, currentNetwork))

  /* Update relatedPeopleData state every time the selected person changes */
  React.useEffect(() => {
    if (!person) return
    setRelatedPeopleData(getRelatedPeople(person, currentNetwork))
    personContentCollection.doc(person.id).onSnapshot(async (snapshot) => {
      await dispatch(setPersonInFocus(person.id))
    })
  }, [person])

  /* Handle updates to individual relationship reasons, updating relatedPeoplData state */
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
  }

  /* Don't render if there is no selected Network or Person  */
  if (!currentNetwork || !person) return null

  // -== FUNCTIONS ==- //
  /**
   * Hide the person menu
   */
  const handleClose = () => {
    dispatch(togglePersonEditMenu(false))
  }

  /**
   * Open the file input menu
   */
  const openFileInput = () => {
    const fileInput = thumbnailUploadRef.current
    fileInput?.click()
  }

  /**
   * Handle thumbnail uploading
   */
  const handleChangeThumbnail = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const fileInput = e.currentTarget

      /* Get the file (first file, multiple files at once are not accepted) */
      const file = fileInput.files ? fileInput.files[0] : null

      /* Stop if no file was uploaded */
      if (!file) throw new Error("No file was uploaded.")

      /* Update the person in the database and in global state  */
      await dispatch(setPersonThumbnail(currentNetwork.id, person.id, file))

      /* Refresh focused person global state */
      await dispatch(setPersonInFocus(person.id))
    } catch (error) {
      /* Failed to upload a thumbnail */
      console.error(error)
    }
  }

  const Thumbnail: React.FC = () => (
    <Box
      align="center"
      justify="center"
      aria-label="Person thumbnail"
      role="Click to change thumbnail"
      height={{ min: "small" }}
    >
      <button
        id="change-thumbnail-button"
        onClick={openFileInput}
        style={{
          background: "transparent",
          cursor: "pointer",
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.5)",
          border: "none",
          padding: "1rem",
          borderRadius: "4px",
          maxWidth: "128px",
        }}
      >
        <input
          id="thumbnail-upload-input"
          ref={thumbnailUploadRef}
          type="file"
          name="thumbnail-upload"
          hidden
          onChange={handleChangeThumbnail}
        />
        {person.thumbnailUrl ? (
          <Image src={person.thumbnailUrl} fill />
        ) : (
          <Icons.User size="xlarge" />
        )}
      </button>
    </Box>
  )

  /* Update the selected Person's content */
  const updateContent = async (content: string) => {
    await dispatch(setPersonContent(person.id, content))
  }

  return (
    <SplitOverlay
      {...props}
      handleClose={handleClose}
      leftChildren={
        <Box dir="column" fill height={{ min: "large" }}>
          <Box height="50%" overflow="auto">
            <Thumbnail />
            <Heading textAlign="center">{person.name}</Heading>
            <Buttons
              person={person}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
            />
          </Box>
          <Box height="40%" overflow="auto" margin={{ top: "medium" }}>
            <Relationships
              currentNetwork={currentNetwork}
              relatedPeopleData={relatedPeopleData}
              handleReasonChange={handleReasonChange}
              currentPerson={person}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
            />
          </Box>
        </Box>
      }
      rightChildren={
        <Box fill height="100%" background="light-2" pad="medium">
          <ContentEditor
            id="person-content-editor"
            editMode={isEditing}
            content={person.content}
            handleSave={updateContent}
          />
        </Box>
      }
    />
  )
}

export default ViewPersonOverlay

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

//                            //
// -== RELATIONSHIPS LIST ==- //
//                            //
interface IRelatedPersonData {
  id: string
  name: string
  reason: string
}

interface IRelationshipsProps {
  currentNetwork: ICurrentNetwork
  currentPerson: IPersonInFocus
  relatedPeopleData: IRelatedPersonData[]
  handleReasonChange: (
    id: string,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}

const Relationships: React.FC<IRelationshipsProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const [didChangeReason, setDidChangeReason] = React.useState<boolean>(false)

  React.useEffect(() => {
    console.log(didChangeReason)
  }, [didChangeReason])

  return (
    <Box
      overflow={{ vertical: "auto" }}
      border={{ color: "brand", side: "top" }}
      pad={{ bottom: "large" }}
      fill
    >
      <Heading level={2} textAlign="center">
        Connections
      </Heading>
      <List
        id="relationships-list"
        data={props.relatedPeopleData}
        border={false}
        children={(person: IRelatedPersonData, index: number) => {
          return (
            <Accordion key={`${person.id}-${index}`} width="large">
              <AccordionPanel
                label={
                  <Box dir="column">
                    <Anchor
                      className="relationship-anchor"
                      /* Go to the related person's menu when clicked */
                      onClick={async () => {
                        try {
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
                          onChange={props.handleReasonChange(person.id)}
                          onFocus={(e) => e.currentTarget.select()}
                          onKeyPress={(e) => {
                            setDidChangeReason(true)

                            if (/(Enter|Escape)/.test(e.key))
                              e.currentTarget.blur()
                          }}
                          onBlur={async (e) => {
                            if (!didChangeReason) return

                            /* Update the relationship */
                            try {
                              await dispatch(
                                updateRelationshipReason(
                                  props.currentPerson.id,
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
              >
                {/* TODO: Additional content */}
                <Box pad="small">Additional content: Coming Soon!</Box>
              </AccordionPanel>
            </Accordion>
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
    </Box>
  )
}

//                 //
// -== BUTTONS ==- //
//                 //
interface IOverlayButtonProps {
  person: IPersonInFocus
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}
const Buttons: React.FC<IOverlayButtonProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()

  /* Get the list of people in the current network */
  const currentNetwork = useSelector<IApplicationState, ICurrentNetwork | null>(
    (state) => state.networks.currentNetwork || null,
  )

  /* Stop if no network is selected */
  if (!currentNetwork) return null

  /* IDs of people related to the selected person */
  const currentRelationshipIds: string[] = Object.keys(
    props.person.relationships,
  )

  /* List of possible people to connect to */
  const relationshipOptions = currentNetwork.people
    .map((p) => {
      /* Exclude already-related people */
      const isAlreadyRelated = currentRelationshipIds.includes(p.id)
      const isSelf = p.id === props.person.id
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
      prompt(`${props.person.name}'s relationship to ${otherPerson.name}:`) ||
      ""
    const p2Reason =
      prompt(`${otherPerson.name}'s relationship to ${props.person.name}:`) ||
      ""

    const p1Id = props.person.id
    const p2Id = otherPerson.id

    try {
      await dispatch(
        connectPeople(currentNetwork.id, { p1Id, p2Id, p1Reason, p2Reason }),
      )

      /* Load updated data */
      await dispatch(setPersonInFocus(props.person.id))
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * Delete a person by their ID
   * @param id
   */
  const deletePerson = (id: string) => async () => {
    if (!currentNetwork) return

    /* Confirm deletion */
    const doDelete = window.confirm(
      `Delete ${props.person.name}? This action cannot be reversed.`,
    )
    if (!doDelete) return

    /* Close the Person overlay */
    dispatch(togglePersonEditMenu(false))

    /* Delete the person */
    try {
      await dispatch(deletePersonById(currentNetwork.id, id))
      await dispatch(getAllPeople(currentNetwork.id))
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Box direction="row" align="center" justify="center">
      {props.isEditing ? (
        // Toggle view mode
        <Button
          icon={<Icons.View color="status-ok" />}
          aria-label="Viewer mode"
          hoverIndicator
          onClick={() => props.setIsEditing(false)}
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
            onClick={deletePerson(props.person.id)}
          />
        </React.Fragment>
      )}
    </Box>
  )
}
