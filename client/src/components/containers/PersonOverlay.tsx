import { Anchor, Box, Button, Heading, Image, Text } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { ActionCreator, AnyAction } from "redux"
import {
  getAllPeople,
  setPersonThumbnail,
  deletePerson as deletePersonById,
} from "../../store/networks/networksActions"
import { ICurrentNetwork } from "../../store/networks/networkTypes"
import { IApplicationState } from "../../store/store"
import {
  setPersonContent,
  setPersonInFocus,
  togglePersonEditMenu,
} from "../../store/ui/uiActions"
import { IPersonInFocus } from "../../store/ui/uiTypes"
import SplitOverlay from "../SplitOverlay"
import ContentEditor from "../ContentEditor"

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

  // -== ACTION BUTTONS ==- //
  const deletePerson = (id: string) => async () => {
    if (!currentNetwork) return

    /* Confirm deletion */
    const doDelete = window.confirm(
      `Delete ${person.name}? This action cannot be reversed.`,
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

  const Buttons: React.FC = () => (
    <Box direction="row" align="center" justify="center">
      {isEditing ? (
        <Button
          icon={<Icons.View color="status-ok" />}
          aria-label="Viewer mode"
          hoverIndicator
          onClick={() => setIsEditing(false)}
        />
      ) : (
        <Button
          icon={<Icons.Edit color="neutral-3" />}
          aria-label="Edit information"
          hoverIndicator
          onClick={() => setIsEditing(true)}
        />
      )}
      <Button
        icon={<Icons.Connect color="neutral-3" />}
        aria-label="Create ponnection"
        hoverIndicator
      />
      <Button
        icon={<Icons.Trash color="status-critical" />}
        aria-label="Delete person"
        hoverIndicator
        onClick={deletePerson(person.id)}
      />
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
                onClick={async () =>
                  await dispatch(setPersonInFocus(otherPerson.id))
                }
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
          <Buttons />
          <Relationships />
        </Box>
      }
      rightChildren={
        <Box fill>
          <ContentEditor content={person.content} handleSave={updateContent} />
        </Box>
      }
    />
  )
}

export default EditPersonOverlay
