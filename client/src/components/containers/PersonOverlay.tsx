import {
  Anchor,
  Box,
  Button,
  DropButton,
  Heading,
  Image,
  List,
  Text,
} from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { ActionCreator, AnyAction, Dispatch } from "redux"
import { personContentCollection } from "../../firebase"
import {
  connectPeople,
  deletePerson as deletePersonById,
  getAllPeople,
  setPersonThumbnail,
} from "../../store/networks/networksActions"
import { ICurrentNetwork } from "../../store/networks/networkTypes"
import { IApplicationState } from "../../store/store"
import {
  setPersonContent,
  setPersonInFocus,
  togglePersonEditMenu,
} from "../../store/ui/uiActions"
import { IPersonInFocus } from "../../store/ui/uiTypes"
import ContentEditor from "../ContentEditor"
import SplitOverlay from "../SplitOverlay"

const EditPersonOverlay: React.FC = () => {
  const [isEditing, setIsEditing] = React.useState(false)
  const dispatch: ActionCreator<AnyAction> = useDispatch()
  const thumbnailUploadRef = React.useRef<HTMLInputElement>(null)

  /* Get all people in the current network */
  const currentNetwork = useSelector<IApplicationState, ICurrentNetwork | null>(
    (state) => state.networks.currentNetwork,
  )

  /* Get the current person in focus */
  const person = useSelector<IApplicationState, IPersonInFocus | null>(
    (state) => state.ui.personInFocus,
  )

  React.useEffect(() => {
    if (!person) return
    personContentCollection.doc(person.id).onSnapshot(async (snapshot) => {
      await dispatch(setPersonInFocus(person.id))
    })
  }, [])

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
      await dispatch(getAllPeople(currentNetwork.id))
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

  const Relationships: React.FC = () => (
    <Box
      overflow={{ vertical: "auto" }}
      border={{ color: "brand", side: "top" }}
      fill="vertical"
      pad={{ bottom: "large", horizontal: "medium" }}
      margin={{ top: "medium" }}
      height={{ min: "xlarge" }}
    >
      <Heading level={2}>Connections</Heading>
      <Box direction="column" overflow={{ vertical: "auto" }}>
        {person.relationships &&
          Object.keys(person.relationships).map((relationshipId, index) => {
            const [thisPersonRel, otherPersonRel] = person.relationships[
              relationshipId
            ]

            /* Find people related to the selected person */
            const otherPerson = currentNetwork.people.find(
              (p) => p.id === relationshipId,
            )
            if (!otherPerson) return null

            const relationshipString = `${otherPerson.name} [${otherPersonRel}]`

            return (
              <Anchor
                /* Go to the related person's menu when clicked */
                onClick={async () => {
                  await dispatch(setPersonInFocus(otherPerson.id))
                  setIsEditing(false)
                }}
                key={`${relationshipId}-${index}`}
              >
                <Text>{relationshipString}</Text>
              </Anchor>
            )
          })}
      </Box>
    </Box>
  )

  /* Update the selected Person's content */
  const updateContent = async (content: string) => {
    await dispatch(setPersonContent(person.id, content))
  }

  // TODO: edit fields, create connections, delete
  return (
    <SplitOverlay
      handleClose={handleClose}
      leftChildren={
        <Box dir="column" fill height={{ min: "large" }}>
          <Thumbnail />
          <Heading textAlign="center">{person.name}</Heading>
          <Buttons
            person={person}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
          <Relationships />
        </Box>
      }
      rightChildren={
        <Box fill>
          <ContentEditor
            editMode={isEditing}
            content={person.content}
            handleSave={updateContent}
          />
        </Box>
      }
    />
  )
}

export default EditPersonOverlay

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
      await dispatch(getAllPeople(currentNetwork.id))
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
        <Button
          icon={<Icons.View color="status-ok" />}
          aria-label="Viewer mode"
          hoverIndicator
          onClick={() => props.setIsEditing(false)}
        />
      ) : (
        <Button
          icon={<Icons.Edit color="neutral-3" />}
          aria-label="Edit information"
          hoverIndicator
          onClick={() => props.setIsEditing(true)}
        />
      )}
      {props.isEditing && (
        <React.Fragment>
          <DropButton
            icon={<Icons.Connect color="neutral-3" />}
            aria-label="Create connection"
            hoverIndicator
            dropContent={
              <React.Fragment>
                <Heading level={4} textAlign="center" color="">
                  Connect with:
                </Heading>
                <List
                  primaryKey="name"
                  onClickItem={connectToPerson}
                  data={relationshipOptions}
                  step={5}
                />
              </React.Fragment>
            }
            dropAlign={{ top: "bottom" }}
          />
          <Button
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
