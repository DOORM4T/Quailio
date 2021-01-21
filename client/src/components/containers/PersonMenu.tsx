import { Box, Image } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { deletePerson as deletePersonById } from "../../store/networks/networksActions"
import { INetwork, IPerson } from "../../store/networks/networkTypes"
import { IApplicationState } from "../../store/store"
import ActionList from "../ActionList"

/**
 * Container Menu for viewing, editing, and deleting individuals from a list of people
 * Uses Redux actions & updates the app's database
 */
const PersonMenu: React.FC<IProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const currentNetwork = useSelector<IApplicationState, INetwork | null>(
    (state) => state.networks.currentNetwork,
  )

  // -== MENU ACTIONS ==- //
  const viewPerson = (id: string) => () => {
    console.log(`View [${id}]`)
  }
  const editPerson = (id: string) => () => {
    console.log(`Edit [${id}]`)
  }
  const deletePerson = (id: string) => async () => {
    if (!currentNetwork) return

    console.log(`Delete [${id}]`)
    try {
      await dispatch(deletePersonById(currentNetwork.id, id))
    } catch (error) {
      console.error(error)
    }
  }

  /* How the list renders the item */
  const renderItem = (item: IPerson, index: number) => {
    return (
      <Box dir="vertical" align="center">
        <Box onClick={() => console.log(item)}>
          {item.thumbnail_url ? (
            <Image src={item.thumbnail_url} />
          ) : (
            <Icons.User />
          )}
        </Box>
        {item.name}
      </Box>
    )
  }

  return (
    <ActionList
      data={props.data}
      renderItem={renderItem}
      handleView={viewPerson}
      handleEdit={editPerson}
      handleDelete={deletePerson}
    />
  )
}

export default PersonMenu

interface IProps {
  data: IPerson[]
}
