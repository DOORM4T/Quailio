import { Box, Button, Image, List, Text, TextInput } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { addPerson } from "../../store/networks/actions"
import { IPerson } from "../../store/networks/networkTypes"
import { getCurrentNetwork } from "../../store/selectors/networks/getCurrentNetwork"
import {
  setPersonInFocus,
  togglePersonEditMenu,
} from "../../store/ui/uiActions"

interface IProps {
  id: string
  data: IPerson[]
  selected: {
    [key: string]: boolean
  }
  setSelected: React.Dispatch<
    React.SetStateAction<{
      [key: string]: boolean
    }>
  >
}

const NAME_CHAR_LIMIT = 30
const PersonMenu: React.FC<IProps> = (props) => {
  // -== STATE ==- //

  const dispatch: Dispatch<any> = useDispatch()
  const currentNetwork = useSelector(getCurrentNetwork)

  // List of people to display in the list
  const [personListData, setPersonListData] = React.useState(props.data)

  // Add/Search input
  const [topInput, setTopInput] = React.useState("")

  // Update the person list whenever it changes or when the topInput search changes
  React.useEffect(() => {
    // Filter the person list
    const search = topInput.toLowerCase().trim()
    const filtered = props.data.filter((person) =>
      person.name.toLowerCase().includes(search),
    )
    setPersonListData(filtered)
  }, [props.data, topInput])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopInput(e.currentTarget.value)
  }

  // Add a person to the network
  const handleAddPerson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Prevent form default behavior

    // Stop if the current network doesn't exist or if the user didn't type anything in the top input
    if (!currentNetwork || topInput === "") return

    try {
      await dispatch(addPerson(currentNetwork.id, topInput)) // Add the person in global state
      setTopInput("") // Clear input
    } catch (error) {
      console.error(error)
    }
  }

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

  /* Add/remove a person from list of selected people 
      This list is for performing batch operations on multiple people */
  const toggleSelected = (id: string) => () => {
    const newSelected = { ...props.selected }
    if (props.selected[id]) {
      newSelected[id] = false
    } else {
      newSelected[id] = true
    }
    props.setSelected(newSelected)
  }

  /* How the list renders the item */
  const renderItem = (item: IPerson, index: number) => {
    const isSelected = props.selected[item.id]

    return (
      <Box
        key={`${item.id}-${index}`}
        direction="row"
        align="center"
        justify="start"
        gap="small"
      >
        <Box
          // onClick={toggleSelected(item.id)} // TODO: Implement batch operations
          aria-label="Select person"
          width="64px"
          height="64px"
          align="start"
          justify="center"
          style={{
            cursor: "pointer",
            filter: isSelected ? "brightness(25%)" : undefined,
          }}
        >
          {item.thumbnailUrl ? (
            <Image src={item.thumbnailUrl} height="64px" width="64px" />
          ) : (
            <Box background="brand" fill align="center" justify="center">
              <Icons.User width="100%" />
            </Box>
          )}
        </Box>
        <Box>
          <Text
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "20ch",
            }}
          >
            {item.name.length > NAME_CHAR_LIMIT
              ? `${item.name.slice(0, NAME_CHAR_LIMIT)}...`
              : item.name}
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <React.Fragment>
      {/* Top input for searching/adding people */}
      <form onSubmit={handleAddPerson}>
        <Box direction="row" align="center" pad="small" gap="none">
          <TextInput
            width="75%"
            placeholder="Search for or add a person"
            onChange={handleInputChange}
            onClick={(e) => e.currentTarget.select()}
            value={topInput}
          />
          <Box direction="row" width="25%" justify="center">
            <Button
              type="submit"
              icon={<Icons.Add />}
              aria-label="Add person"
              hoverIndicator
            />
          </Box>
        </Box>
      </form>

      {/* -== PERSON LIST ==- */}
      {personListData.length > 0 ? (
        <List
          id={props.id}
          data={personListData}
          style={{ overflowY: "auto" }}
          action={(person: IPerson) => (
            <Button
              className="view-person-button"
              icon={<Icons.View />}
              onClick={viewPerson(person.id)}
              key={`view-${person.id}`}
            />
          )}
          children={renderItem}
        />
      ) : (
        <Text textAlign="center">
          No results. Press enter to create the person.
        </Text>
      )}
    </React.Fragment>
  )
}

export default PersonMenu
