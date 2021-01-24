import { Anchor, Avatar, Box, Button, Heading, Text } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { ActionCreator, AnyAction } from "redux"
import { uploadThumbnail } from "../../firebase"
import { setPersonThumbnail } from "../../store/networks/networksActions"
import { IPerson } from "../../store/networks/networkTypes"
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
  const people = useSelector<IApplicationState, IPerson[]>((state) =>
    state.networks.currentNetwork ? state.networks.currentNetwork.people : [],
  )

  /* Get the current person in focus */
  const person = useSelector<IApplicationState, IPerson | null>(
    (state) => state.ui.personInFocus,
  )

  /* Don't render if the Person does not exist */
  if (!person) return null

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
            <Avatar src={person.thumbnailUrl} size="xlarge" round={false} />
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
            const otherPerson = people.find((p) => p.id === relationshipId)
            if (!otherPerson) return

            const relationshipString = `${otherPerson.name} [${otherPersonRel}]`

            return (
              <Anchor
                /* Go to the related person's menu when clicked */
                onClick={() => dispatch(setPersonInFocus(otherPerson))}
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
