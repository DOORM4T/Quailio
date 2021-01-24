import { Anchor, Avatar, Box, Button, Heading, Image, Text } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { ActionCreator, AnyAction } from "redux"
import { uploadThumbnail } from "../../firebase"
import {
  getAllPeople,
  setPersonThumbnail,
} from "../../store/networks/networksActions"
import { ICurrentNetwork, IPerson } from "../../store/networks/networkTypes"
import { IApplicationState } from "../../store/store"
import {
  setPersonInFocus,
  togglePersonEditMenu,
} from "../../store/ui/uiActions"
import SideBar from "../SideBar"

const EditPersonSidebar: React.FC = () => {
  const dispatch: ActionCreator<AnyAction> = useDispatch()
  const thumbnailUploadRef = React.useRef<HTMLInputElement>(null)

  /* Get all people in the current network */
  const currentNetwork = useSelector<IApplicationState, ICurrentNetwork | null>(
    (state) => state.networks.currentNetwork,
  )

  /* Get the current person in focus */
  const person = useSelector<IApplicationState, IPerson | null>(
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

      /* Upload the thumbnail file */
      const url = await uploadThumbnail(file)

      /* Update the person in the database and in global state  */
      await dispatch(setPersonThumbnail(person.id, url))
      await dispatch(getAllPeople(currentNetwork.id))
      await dispatch(setPersonInFocus(person.id))
    } catch (error) {
      /* Failed to upload a thumbnail */
      console.error(error)
    }
  }

  // TODO: Insert thumbnail, edit fields, create connections, delete

  return (
    <SideBar handleClose={handleClose}>
      <Box
        align="center"
        justify="center"
        pad={{ top: "large" }}
        aria-label="Person thumbnail"
        role="Click to change thumbnail"
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
      <Box direction="row" fill="horizontal" pad={{ horizontal: "large" }}>
        <Heading textAlign="center">{person.name}</Heading>
      </Box>

      {/* // -== BUTTONS ==- // */}
      <Box direction="row" align="center" justify="center">
        <Button
          icon={<Icons.Edit color="status-ok" />}
          aria-label="Edit information"
          hoverIndicator
        />
        <Button
          icon={<Icons.Connect color="neutral-3" />}
          aria-label="Create ponnection"
          hoverIndicator
        />
        <Button
          icon={<Icons.Trash color="status-critical" />}
          aria-label="Delete person"
          hoverIndicator
        />
      </Box>

      {/* // -== RELATIONSHIPS ==- // */}
      <Box pad={{ horizontal: "large" }}>
        <Heading level={2}>Relationships</Heading>
        {person.relationships &&
          Object.keys(person.relationships).map((relationshipId, index) => {
            const [thisPersonRel, otherPersonRel] = person.relationships[
              relationshipId
            ]

            /* Find people related to the selected person */
            const otherPerson = currentNetwork.people.find(
              (p) => p.id === relationshipId,
            )
            if (!otherPerson) return

            const relationshipString = `${otherPerson.name} [${otherPersonRel}]`

            return (
              <Anchor
                /* Go to the related person's menu when clicked */
                onClick={() => dispatch(setPersonInFocus(otherPerson.id))}
                key={`${relationshipId}-${index}`}
              >
                <Text>{relationshipString}</Text>
              </Anchor>
            )
          })}
      </Box>
    </SideBar>
  )
}

export default EditPersonSidebar
