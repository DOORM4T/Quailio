import { Anchor, Avatar, Box, Button, Heading, Text } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { ActionCreator, AnyAction } from "redux"
import { IPerson } from "../../store/networks/networkTypes"
import { IApplicationState } from "../../store/store"
import {
  setPersonInFocus,
  togglePersonEditMenu,
} from "../../store/ui/uiActions"
import SideBar from "../SideBar"

const EditPersonSidebar: React.FC = () => {
  const dispatch: ActionCreator<AnyAction> = useDispatch()

  const people = useSelector<IApplicationState, IPerson[]>((state) =>
    state.networks.currentNetwork ? state.networks.currentNetwork.people : [],
  )
  const person = useSelector<IApplicationState, IPerson | null>(
    (state) => state.ui.personInFocus,
  )

  if (!person) return null

  // -== FUNCTIONS ==- //
  const handleClose = () => {
    dispatch(togglePersonEditMenu(false))
  }

  // TODO: Insert thumbnail, edit fields, create connections, delete

  return (
    <SideBar handleClose={handleClose}>
      <Box align="center" justify="center" pad={{ top: "large" }}>
        {person.thumbnailUrl ? (
          <Avatar src={person.thumbnailUrl} size="xlarge" />
        ) : (
          <Icons.User size="xlarge" />
        )}
      </Box>
      <Box
        direction="row"
        align="center"
        justify="center"
        pad={{ horizontal: "large" }}
      >
        <Heading>{person.name}</Heading>
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
            const otherPerson = people.find((p) => p.id === relationshipId)
            if (!otherPerson) return

            const relationshipString = `${otherPerson.name} [${otherPersonRel}]`

            return (
              <Anchor
                // go to the on the related person's menu when clicked
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
