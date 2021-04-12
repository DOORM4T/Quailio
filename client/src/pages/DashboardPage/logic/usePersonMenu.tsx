import {
  AccordionPanel,
  Box,
  Button,
  Image,
  List,
  Stack,
  Text,
  TextInput,
} from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch } from "react"
import { useDispatch, useSelector } from "react-redux"
import ToolTipButton from "../../../components/ToolTipButton"
import { addPerson } from "../../../store/networks/actions"
import { IPerson } from "../../../store/networks/networkTypes"
import { getCurrentNetwork } from "../../../store/selectors/networks/getCurrentNetwork"
import { getFilterGroups } from "../../../store/selectors/ui/getFilterGroups"
import { getIsViewingShared } from "../../../store/selectors/ui/getIsViewingShared"
import { getShowNodesWithoutGroups } from "../../../store/selectors/ui/getShowNodesWithoutGroups"
import {
  cachePersonGroupList,
  setPersonInFocus,
  toggleGroupFilter,
  togglePersonOverlay,
  toggleShowNodesWithoutGroups,
  zoomToPerson,
} from "../../../store/ui/uiActions"
import { IPersonIDWithActiveGroups } from "../../../store/ui/uiTypes"
import { IPersonMenuProps } from "../PersonMenu"

const NAME_CHAR_LIMIT = 30

export default function usePersonMenu({ people }: IPersonMenuProps) {
  const dispatch: Dispatch<any> = useDispatch()

  // REDUX SELECTOR | Current network state
  const currentNetwork = useSelector(getCurrentNetwork)

  // REDUX SELECTOR | Map of groups to show/hide
  const filterGroups = useSelector(getFilterGroups)

  // REDUX SELECTOR | Map of visible groups IDs by person ID
  const showNodesWithoutGroups = useSelector(getShowNodesWithoutGroups)

  // VARS | Icon and ToolTip text to show based on "showNodesWithoutGroups" global state
  const showNodesWithoutGroupsIcon = (
    <Icons.AppsRounded
      color={showNodesWithoutGroups ? "status-ok" : "status-critical"}
    />
  )
  const showNodesWithoutGroupsToolTip = showNodesWithoutGroups
    ? "Click to hide nodes without groups"
    : "Click to show nodes without groups"

  // VARS | Derived from current network; Track whether there are groups or not
  const groups = currentNetwork?.relationshipGroups
  const hasGroups = groups && Object.keys(groups).length > 0

  // REDUX SELECTOR | Viewing a shared network?
  const isViewingShared = useSelector(getIsViewingShared)

  // STATE | An array of filtered people -- The default list comes from the "people" prop
  const [filterablePeople, setFilterablePeople] = React.useState(people)

  // STATE | For the Add/Search controlled-input
  const [searchAddInput, setSearchAddInput] = React.useState("")

  // STATE | For navigating highlighting an item at an index in the list UI
  const [searchIndex, setSearchIndex] = React.useState(0)

  const isSearching = currentNetwork
    ? currentNetwork.personIds.length !== filterablePeople.length ||
      searchIndex > -1
    : false

  // STATE | Indicates whether all groups are showing or not. Used to toggle all groups on/off.
  const [isShowingAllGroups, setShowingAllGroups] = React.useState<boolean>(
    true,
  )

  // VARS | Icon and ToolTip text to show based on "isShowingAllGroups" state
  const showHideAllIcon = isShowingAllGroups ? (
    <Icons.FormView color="status-ok" size="medium" />
  ) : (
    <Icons.Hide color="status-critical" size="medium" />
  )
  const showHideAllToolTip = isShowingAllGroups
    ? "Click to hide all groups"
    : "Click to show all groups"

  // REF | For managing the list DOM  (e.g. to focus on an item)
  const listRef = React.useRef<HTMLUListElement>()
  const allGroupButtonLabelRef = React.useRef<HTMLButtonElement>()

  // EFFECT | Update the filterablePeople list
  React.useEffect(() => {
    // Filter the original person list using the search/add input
    const search = searchAddInput.toLowerCase().trim()
    const filtered = people.filter((person) =>
      person.name.toLowerCase().includes(search),
    )
    setFilterablePeople(filtered)

    // Reset the search index (stop highlighting)
    setSearchIndex(-1)
  }, [people, searchAddInput]) // ACTIVATES | When the people prop or search/add input state change

  // EFFECT | Make the force-graph zoom-in on the person corresponding to the searchIndex state
  React.useEffect(() => {
    // Ensure the list ref exists -- stop if there's no list ref
    if (!listRef.current) return
    // Ensure the foundIndex corresponds to a list item
    if (searchIndex >= 0 && searchIndex < filterablePeople.length) {
      // Scroll the person node into view
      listRef.current.children[searchIndex].scrollIntoView({
        behavior: "smooth",
      })

      // Zoom in on the selected person in the force-graph
      dispatch(zoomToPerson(filterablePeople[searchIndex].id))
    }
  }, [searchIndex]) // ACTIVATES | When searchIndex state changes

  /* EFFECT | Cache global "groupsByPersonIds" state for people and the active/visible groups they're in 
            |    The "groupsByPersonIds" global state is used by the force-graph 
            |    -- setting/caching the state from this PersonMenu component saves a lot of
            |    processing that would otherwise be inefficiently calculated during each tick of the force-graph  */
  React.useEffect(() => {
    // Stop if there aren't any groups in the current network -- this means there's no person-group data to cache
    if (!groups || !hasGroups) return

    // Get an array of objects containing a personId and active groups containing that person
    const groupsByPersonIds = filterablePeople.map((person) => {
      const groupsWithThisPerson = Object.keys(groups).filter((groupId) =>
        groups[groupId].personIds.includes(person.id),
      )

      // Keep only the active groups the person is in
      const activeGroupIds = groupsWithThisPerson.filter(
        (groupId) =>
          filterGroups[groupId] === true || filterGroups[groupId] === undefined, // Treat a group's undefined "showing" state as true -- show by default
      )

      const data: IPersonIDWithActiveGroups = {
        personId: person.id,
        activeGroupIds,
      }
      return data
    })

    // Pass the array to a custom Redux action that will result in this information being cached in global state
    dispatch(cachePersonGroupList(groupsByPersonIds))
  }, [currentNetwork?.people, groups, filterGroups]) // ACTIVATES | When the people list, groups, or filterGroups change

  // FUNCTION | Set search/add input state when an input value changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchAddInput(e.currentTarget.value)
  } // END | handleInputChange

  // FUNCTION | Add a person to the current network
  const handleAddPerson = async () => {
    // Stop if the current network doesn't exist or if the user didn't type anything in the top input
    if (!currentNetwork || searchAddInput === "") return

    // Stop if viewing a shared network
    if (isViewingShared) return

    try {
      await dispatch(toggleShowNodesWithoutGroups(true))
      await dispatch(addPerson(currentNetwork.id, searchAddInput)) // Add the person in global state
      setSearchAddInput("") // Clear the search/add input
    } catch (error) {
      console.error(error)
    }
  } // END | handleAddPerson

  // FUNCTION | Open a Person's content menu
  const viewPerson = (id: string) => async () => {
    if (!currentNetwork) return
    const person = currentNetwork.people.find((p) => p.id === id)
    if (!person) return

    // Focus on the person's info and open the content overlay
    try {
      await dispatch(setPersonInFocus(person.id))
      dispatch(togglePersonOverlay(true))
    } catch (error) {
      console.error(error)
    }
  } // END | viewPerson

  // FUNCTION | Un-zoom on a person in the force-graph
  const resetZoomedPerson = () => {
    dispatch(zoomToPerson(null))

    if (searchIndex > -1) {
      // Zoom back in on current search value
      dispatch(zoomToPerson(filterablePeople[searchIndex].id))
    }
  } // END | resetZoomedPerson

  /**
   * Creates a function for how a list renders items
   * @param canSearch whether the search item can be highlighted or not (this will only be enabled for the "ALL" list). Closure data for the created function.
   * @returns UI for the item
   */
  const renderItem = (canSearch: boolean) => (item: IPerson, index: number) => {
    const isSelected = canSearch && searchIndex === index

    const PersonIconBox: React.ReactNode = (
      <Box
        onClick={viewPerson(item.id)} // Open the person overlay when clicked
        // onClick={toggleSelected(item.id)} // TODO: Implement batch operations
        onMouseEnter={() => {
          dispatch(zoomToPerson(item.id))
        }} // Set the "zoomed-in person" in global state. The force-graph will zoom in on that person.
        onMouseLeave={resetZoomedPerson}
        aria-label="Select person"
        width="64px"
        height="64px"
        align="start"
        justify="center"
        style={{
          cursor: "pointer",
          filter: isSelected ? "brightness(200%)" : undefined,
        }}
      >
        <Box background="brand" fill align="center" justify="center">
          {item.thumbnailUrl ? (
            <Image src={item.thumbnailUrl} height="64px" width="64px" />
          ) : (
            <Icons.User width="100%" />
          )}
        </Box>
      </Box>
    )

    const PersonNameBox: React.ReactNode = (
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
    )

    return (
      <Box
        key={`${item.id}-${index}`}
        direction="row"
        align="center"
        justify="start"
        gap="small"
      >
        {/* Icon Box on left */}
        {PersonIconBox}

        {/* Name to the right of the Icon Box */}
        {PersonNameBox}
      </Box>
    )
  } // END renderItem

  // FUNCTION | Handles certain shortkey inputs from the add/search input
  const handleAddSearchInputShortkeys = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      if (e.ctrlKey) {
        // Add the person in the search box if CTRL+ENTER
        await handleAddPerson()
      } else if (e.shiftKey) {
        // Select previous if SHIFT+ENTER
        let prevIndex = searchIndex - 1
        if (prevIndex < 0) prevIndex = filterablePeople.length - 1
        setSearchIndex(prevIndex)
      } else {
        // Select next if ENTER
        setSearchIndex((searchIndex + 1) % filterablePeople.length)
      }
    } else if (e.key === "Escape") {
      // Blur from the add/search input on ESC
      e.currentTarget.blur()
    }
  } // END | handleAddSearchInputShortKeys

  // FUNCTION | Function to show/hide all groups
  const toggleHideShowAllGroups = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation() // Prevent the button click from propagating to the accordion (to avoid unintentional closing/opening of the accordion)
    if (!groups) return // Stop if there are no groups

    const groupIds = Object.keys(groups)

    // If currently showing all, hide all
    if (isShowingAllGroups) {
      groupIds.forEach((groupId) => {
        dispatch(toggleGroupFilter(groupId, false))
      })
      setShowingAllGroups(false)
    } else {
      // Otherwise, show all
      groupIds.forEach((groupId) => {
        dispatch(toggleGroupFilter(groupId, true))
      })
      setShowingAllGroups(true)
    }
  } // END | toggleHideShowAllGroups

  // FUNCTION | Toggle showing/hiding of nodes without groups -- true means the force-graph will show nodes without groups
  const toggleShowNodesWithoutGroupsFunc = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation() // Prevent the button click from propagating to the accordion (to avoid unintentional closing/opening of the accordion)
    dispatch(toggleShowNodesWithoutGroups(!showNodesWithoutGroups)) // Toggle the global UI state
  } // END | toggleShowNodesWithoutGroupsFunc

  // FUNCTION | Clear search state
  const handleClearSearch = () => {
    setSearchAddInput("")
    setSearchIndex(-1)
    dispatch(zoomToPerson(null))
  } // END | handleClearSearch

  const searchPlaceholder = `Search for (ENTER, SHIFT+ENTER) ${
    !isViewingShared ? "or add" : ""
  } a person`

  const isSearchingAll = isSearching && searchAddInput === ""

  // UI | Input for searching/adding people
  const SearchAddInputNode: React.ReactNode = (
    <Box direction="row" align="center" pad="small" gap="none">
      <Stack anchor="right" style={{ width: "100%" }}>
        <TextInput
          width={`${isViewingShared ? "100%" : "75%"}`}
          placeholder={isSearchingAll ? "Searching all..." : searchPlaceholder}
          onChange={handleInputChange}
          onClick={(e) => e.currentTarget.select()}
          value={searchAddInput}
          onKeyUp={handleAddSearchInputShortkeys}
          style={{ fontSize: "12px" }}
        />
        {/* Clear search button */}
        {isSearching && (
          <button
            aria-label="Clear search"
            onClick={handleClearSearch}
            style={{
              background: "transparent",
              cursor: "pointer",
              border: "none",
              width: 32,
              height: 32,
              display: "grid",
              placeItems: "center",
              marginRight: "1rem",
              padding: "1px 0 0 0",
            }}
          >
            <Icons.Close color="status-critical" />
          </button>
        )}
      </Stack>
      {!isViewingShared && (
        <Box direction="row" width="25%" justify="center">
          <Button
            onClick={handleAddPerson}
            type="submit"
            icon={<Icons.Add />}
            aria-label="Add person (Click or CTRL+ENTER)"
            hoverIndicator
          />
        </Box>
      )}
    </Box>
  ) // END | SearchAddInputNode

  // UI | Accordion Panel for the "All" people list
  const AllPeopleGroup: React.ReactNode = (
    <AccordionPanel
      key="group-all"
      style={{
        height: "48px",
        backgroundColor: "#AAA",
        color: "#222",
      }}
      ref={(el: any) =>
        (allGroupButtonLabelRef.current = el as HTMLButtonElement)
      }
      label={
        <Box
          direction="row"
          justify="start"
          align="center"
          style={{ fontWeight: "bold" }}
          fill
        >
          <span style={{ marginLeft: "1rem" }}>
            [{filterablePeople.length}]
          </span>
          <span style={{ marginLeft: "1rem", marginRight: "auto" }}>
            {isSearching ? `Search: ${searchAddInput}` : "All"}
          </span>
          {!isSearching && hasGroups && (
            // Show these option buttons if there are groups in the network
            <React.Fragment>
              <ToolTipButton
                onClick={toggleShowNodesWithoutGroupsFunc}
                icon={showNodesWithoutGroupsIcon}
                tooltip={showNodesWithoutGroupsToolTip}
              />
              <ToolTipButton
                onClick={toggleHideShowAllGroups}
                icon={showHideAllIcon}
                tooltip={showHideAllToolTip}
              />
            </React.Fragment>
          )}
        </Box>
      }
    >
      {filterablePeople.length > 0 ? (
        <List
          data={filterablePeople}
          children={renderItem(true)}
          ref={(el: any) => (listRef.current = el)}
        />
      ) : (
        <Box pad="medium">
          <Text textAlign="center">Nothing here... yet!</Text>
        </Box>
      )}
    </AccordionPanel>
  ) // END | AllPeopleGroup

  return {
    AllPeopleGroup,
    allGroupButtonLabelRef,
    currentNetwork,
    dispatch,
    filterablePeople,
    filterGroups,
    isSearching,
    isViewingShared,
    renderItem,
    searchAddInput,
    SearchAddInputNode,
  }
}
