import { Box, Button, Image, List, Text } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { ICurrentNetwork, IPerson } from "../../store/networks/networkTypes"
import { IApplicationState } from "../../store/store"
import {
  setPersonInFocus,
  togglePersonEditMenu,
} from "../../store/ui/uiActions"
import EditPersonOverlay from "./PersonOverlay"

const PersonMenu: React.FC<IProps> = (props) => {
  // -== STATE ==- //
  const dispatch: Dispatch<any> = useDispatch()
  const isEditMenuOpen = useSelector<IApplicationState, boolean>(
    (state) => state.ui.isPersonEditMenuOpen,
  )
  const currentNetwork = useSelector<IApplicationState, ICurrentNetwork | null>(
    (state) => state.networks.currentNetwork,
  )

  /* Open a Person's content menu */
  const viewPerson = (id: string) => async () => {
    if (!currentNetwork) return
    const person = currentNetwork.people.find((p) => p.id === id)
    if (!person) return

    /* focus on the person */
    try {
      await dispatch(setPersonInFocus(person.id))
      /* open edit menu */
      dispatch(togglePersonEditMenu(true))
    } catch (error) {
      console.error(error)
    }
  }

  /* How the list renders the item */
  const renderItem = (item: IPerson, index: number) => {
    return (
      <Box
        dir="row"
        align="start"
        fill="horizontal"
        key={`${item.id}-${index}`}
      >
        <Box onClick={() => console.log(item)}>
          {item.thumbnailUrl ? (
            <Image src={item.thumbnailUrl} height="64px" />
          ) : (
            <Icons.User height="64px" />
          )}
        </Box>
        <Text>{item.name}</Text>
      </Box>
    )
  }

  return (
    <React.Fragment>
      {/* -== PERSON LIST ==- */}
      <List
        data={props.data}
        margin={{ bottom: "medium" }}
        style={{ overflowY: "auto" }}
        action={(person: IPerson) => (
          <Button
            icon={<Icons.View />}
            onClick={viewPerson(person.id)}
            key={`view-${person.id}`}
          />
        )}
        children={renderItem}
      />

      {/* -== SIDEBAR ==- */}
      {isEditMenuOpen && <EditPersonOverlay />}
    </React.Fragment>
  )
}

export default PersonMenu

interface IProps {
  data: IPerson[]
}
