import {
  Anchor,
  Box,
  Button,
  DropButton,
  Grid,
  Header,
  Heading,
  List,
  Tab,
  Tabs,
  Text,
  TextInput,
} from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { fireUnsavedChangeEvent } from "../../helpers/unsavedChangeEvent"
import useSmallBreakpoint from "../../hooks/useSmallBreakpoint"
import {
  connectPeople,
  deletePerson as deletePersonById,
  disconnectPeople,
  getAllPeople,
  updateRelationshipReason,
} from "../../store/networks/networksActions"
import { ICurrentNetwork, IPerson } from "../../store/networks/networkTypes"
import { getCurrentNetwork } from "../../store/selectors/networks/getCurrentNetwork"
import { getPersonInFocus } from "../../store/selectors/ui/getPersonInFocus"
import {
  setPersonContent,
  setPersonInFocus,
  togglePersonEditMenu,
} from "../../store/ui/uiActions"
import { IPersonInFocus } from "../../store/ui/uiTypes"
import ContentEditor from "../ContentEditor"
import Overlay from "../Overlay"
import UploadPersonThumbnail from "./OverlayComponents/UploadPersonThumbnail"

interface IProps {
  id: string
}

const ViewPersonOverlay: React.FC<IProps> = (props) => {
  // -== GLOBAL STORE HOOKS ==- //
  const dispatch: Dispatch<any> = useDispatch()
  const isSmall = useSmallBreakpoint()

  /* Get the current network */
  const currentNetwork = useSelector(getCurrentNetwork)

  /* Get the current person in focus */
  const currentPerson = useSelector(getPersonInFocus)

  // -== LOCAL STATE & OTHER HOOKS ==- //
  const [isEditing, setIsEditing] = React.useState(false) // Whether the overlay is in edit mode or not

  /* Don't render if there is no selected Network or Person  */
  if (!currentNetwork || !currentPerson) return null

  // -== FUNCTIONS ==- //
  /**
   * Hide the person menu
   */
  const handleClose = () => {
    /* If there are unsaved changes, ask the user to confirm  */
    const doContinue = fireUnsavedChangeEvent()
    if (!doContinue) return

    /* Close overlay */
    dispatch(togglePersonEditMenu(false))
  }

  /* Update the selected Person's content */
  const updateContent = async (newContent: string) => {
    await dispatch(setPersonContent(currentPerson.id, newContent))
  }

  // -== COMPONENTS ==- //
  /* Person Header */
  const PersonHeader: React.ReactNode = (
    <Header direction="column" background="brand" pad="medium" justify="start">
      <UploadPersonThumbnail
        currentNetwork={currentNetwork}
        currentPerson={currentPerson}
      />
      {isEditing ? (
        <TextInput
          value={currentPerson.name}
          textAlign="center"
          onClick={(e) => e.currentTarget.select()}
        />
      ) : (
        <h1
          aria-label="Name"
          style={{
            padding: "1rem",
            margin: 0,
            lineHeight: "2rem",
            whiteSpace: "break-spaces",
            wordWrap: "break-word",
            wordBreak: "break-all",
            overflow: "auto",
            height: "4rem",
          }}
        >
          {currentPerson.name}
        </h1>
      )}
      <Buttons
        currentNetwork={currentNetwork}
        currentPerson={currentPerson}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
    </Header>
  )

  /* Reusable relationships container */
  const RelationshipsContainer: React.ReactNode = (
    <Relationships
      currentNetwork={currentNetwork}
      currentPerson={currentPerson}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
    />
  )

  /* Content & Content Editor container */
  const ContentContainer: React.ReactNode = isEditing ? (
    <ContentEditor
      id="person-content-editor"
      content={currentPerson.content}
      handleSave={updateContent}
    />
  ) : (
    <div
      dangerouslySetInnerHTML={{
        __html: currentPerson.content || "Write anything!",
      }}
    />
  )

  const SmallScreenLayout: React.FC = () => (
    <Box fill>
      {PersonHeader}
      <Box direction="column" background="dark-1" pad="medium" fill>
        <Tabs>
          <Tab title="Content">
            <Box
              background="light-2"
              pad="medium"
              style={{ borderRadius: "2px" }}
              overflow={{ vertical: "auto" }}
              fill
            >
              {ContentContainer}
            </Box>
          </Tab>
          <Tab title="Relationships">{RelationshipsContainer}</Tab>
        </Tabs>
      </Box>
    </Box>
  )

  const LargeScreenLayout: React.FC = () => (
    <Grid
      fill
      rows={["auto", "auto"]}
      columns={["medium", "auto"]}
      areas={[
        { name: "header", start: [0, 0], end: [0, 0] },
        { name: "relationships", start: [0, 1], end: [0, 1] },
        { name: "contentEditor", start: [1, 0], end: [1, 1] },
      ]}
    >
      {PersonHeader}
      <Box
        gridArea="relationships"
        overflow={{ vertical: "auto" }}
        background="dark-1"
        fill
      >
        {RelationshipsContainer}
      </Box>
      <Box
        gridArea="contentEditor"
        background="light-2"
        pad="medium"
        fill
        overflow={{ vertical: "auto" }}
      >
        {ContentContainer}
      </Box>
    </Grid>
  )

  return (
    <Overlay id={props.id} handleClose={handleClose}>
      {isSmall ? <SmallScreenLayout /> : <LargeScreenLayout />}
    </Overlay>
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
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}

const Relationships: React.FC<IRelationshipsProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const [didChangeReason, setDidChangeReason] = React.useState<boolean>(false)

  /* Relationship state based on the selected person */
  const [relatedPeopleData, setRelatedPeopleData] = React.useState<
    IRelatedPersonData[]
  >(getRelatedPeople(props.currentPerson, props.currentNetwork))

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
    setRelatedPeopleData(updatedPeople) // TODO: This state update rerenders everything...
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

//                 //
// -== BUTTONS ==- //
//                 //
interface IOverlayButtonProps {
  currentNetwork: ICurrentNetwork
  currentPerson: IPersonInFocus
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}
const Buttons: React.FC<IOverlayButtonProps> = (props) => {
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
