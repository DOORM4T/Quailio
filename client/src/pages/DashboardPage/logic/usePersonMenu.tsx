import { Box, Button, Image, Text } from "grommet"
import * as Icons from "grommet-icons"
import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { addPerson } from "../../../store/networks/actions"
import { ICurrentNetwork, IPerson } from "../../../store/networks/networkTypes"
import { getIsViewingShared } from "../../../store/selectors/ui/getIsViewingShared"
import { IApplicationState } from "../../../store/store"
import { setNodeVisibility, zoomToPerson } from "../../../store/ui/uiActions"
import useViewPerson from "./useViewPerson"

const NAME_CHAR_LIMIT = 30
export const SEARCH_INPUT_HEIGHT = "48px"

interface IProps {
  currentNetwork: ICurrentNetwork
}
export default function usePersonMenu({ currentNetwork }: IProps) {
  const dispatch: Dispatch<any> = useDispatch()
  const isViewingShared = useSelector(getIsViewingShared)
  const visibilityMap = useSelector(
    (state: IApplicationState) => state.ui.personNodeVisibility,
  )
  const people = currentNetwork.people

  const [filterablePeople, setFilterablePeople] = useState(people)

  const [searchInput, setSearchInput] = useState("")
  const isSearching = currentNetwork
    ? currentNetwork.personIds.length !== filterablePeople.length
    : false

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.currentTarget.value)
  }
  const clearSearch = () => setSearchInput("")

  useEffect(() => {
    // Filter the original person list using the search input
    const search = searchInput.toLowerCase().trim()
    const filtered = people.filter((person) =>
      person.name.toLowerCase().includes(search),
    )
    setFilterablePeople(filtered)
  }, [people, searchInput])

  const handleAddPerson = async () => {
    const doDisable = !currentNetwork || searchInput === "" || isViewingShared
    if (doDisable) return

    try {
      await dispatch(addPerson(currentNetwork!.id, searchInput))
    } catch (error) {
      console.error(error)
    }
  } // handleAddPerson

  const { viewPerson } = useViewPerson(currentNetwork)

  /**
   * Creates a function for how a list renders items
   * @param canSearch whether the search item can be highlighted or not (this will only be enabled for the "ALL" list). Closure data for the created function.
   * @returns UI for the item
   */
  const renderItem = (person: IPerson, index: number) => {
    const PersonIconBox = (
      <Box
        onClick={viewPerson(person.id)} // Open the person overlay when clicked
        onMouseEnter={() => dispatch(zoomToPerson(person.id))}
        onMouseLeave={() => dispatch(zoomToPerson(null))}
        aria-label="Select person"
        width="64px"
        height="64px"
        align="start"
        justify="center"
        style={{ cursor: "pointer" }}
      >
        <Box
          fill
          background="light-1"
          align="center"
          justify="center"
          style={{ borderRadius: 4 }}
        >
          {person.thumbnailUrl ? (
            <Image src={person.thumbnailUrl} height="64px" width="64px" />
          ) : (
            <Icons.User width="100%" />
          )}
        </Box>
      </Box>
    )

    const PersonNameBox = (
      <Box>
        <Text
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "20ch",
          }}
        >
          {person.name.length > NAME_CHAR_LIMIT
            ? `${person.name.slice(0, NAME_CHAR_LIMIT)}...`
            : person.name}
        </Text>
      </Box>
    )

    const isVisible = visibilityMap[person.id] !== false // undefined and true mean the node is visible
    const toggleVisibility = async () => {
      dispatch(setNodeVisibility(person.id, !isVisible))
    }

    const VisibilityToggle: React.ReactNode = (
      <Button
        icon={isVisible ? <Icons.FormView /> : <Icons.FormViewHide />}
        onClick={toggleVisibility}
      />
    )

    return (
      <Box
        key={`${person.id}-${index}`}
        direction="row"
        align="center"
        justify="start"
        gap="small"
        style={{ filter: isVisible ? undefined : "brightness(0.5)" }}
      >
        {PersonIconBox}
        {PersonNameBox}
        <Box margin={{ left: "auto" }}>{VisibilityToggle}</Box>
      </Box>
    )
  } // END renderItem

  const handleSearchInputShortkeys = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.ctrlKey && e.key === "Enter") {
      await handleAddPerson()
      return
    }

    if (e.key === "Escape") {
      e.currentTarget.blur()
      return
    }
  } // handleAddSearchInputShortKeys

  return {
    currentNetwork,
    filterablePeople,
    isViewingShared,
    renderItem,
    search: {
      searchInput,
      isSearching,
      handleSearchChange,
      clearSearch,
      handleSearchInputShortkeys,
    },
  }
}
