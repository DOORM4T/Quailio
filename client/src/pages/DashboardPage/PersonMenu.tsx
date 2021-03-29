import {
  Accordion,
  AccordionPanel,
  Box,
  Button,
  Image,
  List,
  Tab,
  Tabs,
  Text,
  TextInput,
} from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import SearchAndCheckMenu from "../../components/SearchAndCheckMenu"
import ToolTipButton from "../../components/ToolTipButton"
import { addPerson, deleteGroup } from "../../store/networks/actions"
import { togglePersonInGroup } from "../../store/networks/actions/togglePersonInGroup"
import { IPerson } from "../../store/networks/networkTypes"
import { getCurrentNetwork } from "../../store/selectors/networks/getCurrentNetwork"
import { getFilterGroups } from "../../store/selectors/ui/getFilterGroups"
import { getShowNodesWithoutGroups } from "../../store/selectors/ui/getShowNodesWithoutGroups"
import {
  initializePersonGroupList,
  setPersonInFocus,
  toggleGroupFilter,
  togglePersonEditMenu,
  toggleShowNodesWithoutGroups,
  zoomToPerson,
} from "../../store/ui/uiActions"
import { IPersonIDWithActiveGroups } from "../../store/ui/uiTypes"

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
  const filterGroups = useSelector(getFilterGroups) // Global state for filtering groups
  const showNodesWithoutGroups = useSelector(getShowNodesWithoutGroups) // Global state for showing nodes without groups

  // Variables tracking if there are groups or not
  const groups = currentNetwork?.relationshipGroups
  const hasGroups = groups && Object.keys(groups).length > 0

  // List of people to display in the list
  const [personListData, setPersonListData] = React.useState(props.data)

  // Add/Search input
  const [topInput, setTopInput] = React.useState("")

  // State to navigate through the found persons list
  const [foundIndex, setFoundIndex] = React.useState(0)

  // List ref for managing the list DOM  (e.g. to focus on an item)
  const listRef = React.useRef<HTMLUListElement>()

  // Update the person list whenever it changes or when the topInput search changes
  React.useEffect(() => {
    // Filter the person list
    const search = topInput.toLowerCase().trim()
    const filtered = props.data.filter((person) =>
      person.name.toLowerCase().includes(search),
    )
    setPersonListData(filtered)
    setFoundIndex(-1)
  }, [props.data, topInput])

  // Focus on the person at a corresponding foundIndex
  React.useEffect(() => {
    // Stop if there's no list ref
    if (!listRef.current) return

    // Ensure the foundIndex exists
    if (foundIndex >= 0 && foundIndex < personListData.length) {
      // Scroll the person node into view
      listRef.current.children[foundIndex].scrollIntoView({
        behavior: "smooth",
      })

      // Zoom in on the selected person in the force-graph
      dispatch(zoomToPerson(personListData[foundIndex].id))
    }
  }, [foundIndex])

  React.useEffect(() => {
    if (!groups || !hasGroups) return

    // Initialize active groups global state for each person (caches person state & groups for showing/hiding people by group)
    const groupsByPersonIds = personListData.map((person) => {
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

    dispatch(initializePersonGroupList(groupsByPersonIds))
  }, [currentNetwork?.people, groups, filterGroups]) // Re-initialize if any of these states change

  //
  // FUNCTIONS
  //

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopInput(e.currentTarget.value)
  }

  // Add a person to the network
  const handleAddPerson = async () => {
    // Stop if the current network doesn't exist or if the user didn't type anything in the top input
    if (!currentNetwork || topInput === "") return

    try {
      await dispatch(addPerson(currentNetwork.id, topInput)) // Add the person in global state
      setTopInput("") // Clear the search/add input
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

  // Function to un-zoom on a person
  const resetZoomedPerson = () => dispatch(zoomToPerson(null))

  /**
   * How the lists render items
   * @param canSearch whether the search item can be highlighted or not (this will only be enabled for the "ALL" list)
   */
  const renderItem = (canSearch: boolean) => (item: IPerson, index: number) => {
    // TODO: Batch select -- const isSelected = props.selected[item.id]
    const isSelected = canSearch && foundIndex === index

    return (
      <Box
        key={`${item.id}-${index}`}
        direction="row"
        align="center"
        justify="start"
        gap="small"
      >
        <Box
          onClick={viewPerson(item.id)} // Open the person overlay when clicked
          // onClick={toggleSelected(item.id)} // TODO: Implement batch operations
          onMouseEnter={() => {
            dispatch(zoomToPerson(item.id))
            setFoundIndex(-1) // Clear the foundPerson highlight
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

  const handleShortkeys = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (e.ctrlKey) {
        // Add the person in the search box if CTRL+ENTER
        await handleAddPerson()
      } else if (e.shiftKey) {
        // Select previous if SHIFT+ENTER
        let prevIndex = foundIndex - 1
        if (prevIndex < 0) prevIndex = personListData.length - 1
        setFoundIndex(prevIndex)
      } else {
        // Select next if ENTER
        setFoundIndex((foundIndex + 1) % personListData.length)
      }
    } else if (e.key === "Escape") {
      e.currentTarget.blur()
    }
  }

  // Function to Show/hide all groups
  const [isShowingAll, setShowingAll] = React.useState<boolean>(true)
  const showHideAllIcon = isShowingAll ? (
    <Icons.FormView color="status-ok" size="medium" />
  ) : (
    <Icons.Hide color="status-critical" size="medium" />
  )
  const showHideAllToolTip = isShowingAll
    ? "Click to hide all groups"
    : "Click to show all groups"
  const toggleHideShowAll = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation() // Prevent the button click from propagating to the accordion (to avoid unintentional closing/opening of the accordion)
    if (!groups) return // Stop if there are no groups

    const groupIds = Object.keys(groups)

    // If currently showing all, hide all
    if (isShowingAll) {
      groupIds.forEach((groupId) => {
        dispatch(toggleGroupFilter(groupId, false))
      })
      setShowingAll(false)
    } else {
      // Otherwise, show all
      groupIds.forEach((groupId) => {
        dispatch(toggleGroupFilter(groupId, true))
      })
      setShowingAll(true)
    }
  }

  // Function to toggle showing of nodes without groups -- true means the force-graph will show nodes without groups
  const showNodesWithoutGroupsIcon = (
    <Icons.AppsRounded
      color={showNodesWithoutGroups ? "status-ok" : "status-critical"}
    />
  )
  const showNodesWithoutGroupsToolTip = showNodesWithoutGroups
    ? "Click to hide nodes without groups"
    : "Click to show nodes without groups"
  const toggleShowNodesWithoutGroupsFunc = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation() // Prevent the button click from propagating to the accordion (to avoid unintentional closing/opening of the accordion)
    dispatch(toggleShowNodesWithoutGroups(!showNodesWithoutGroups)) // Toggle the global UI state
  }

  return (
    <React.Fragment>
      {/* Top input for searching/adding people */}
      <Box direction="row" align="center" pad="small" gap="none">
        <TextInput
          width="75%"
          placeholder="Search for (ENTER, SHIFT+ENTER) or add a person (CTRL+ENTER)"
          onChange={handleInputChange}
          onClick={(e) => e.currentTarget.select()}
          onBlur={() => setFoundIndex(-1)}
          value={topInput}
          onKeyUp={handleShortkeys}
          style={{ fontSize: "12px" }}
        />
        <Box direction="row" width="25%" justify="center">
          <Button
            onClick={handleAddPerson}
            type="submit"
            icon={<Icons.Add />}
            aria-label="Add person (Click or CTRL+ENTER)"
            hoverIndicator
          />
        </Box>
      </Box>

      {/* -== PERSON LISTS ==- */}
      {currentNetwork && (
        <Box fill style={{ overflowY: "auto" }}>
          <Accordion animate={false} multiple={true}>
            {/* Group for ALL people in the network */}
            <AccordionPanel
              key="group-all"
              style={{
                height: "48px",
                backgroundColor: "#AAA",
                color: "#222",
              }}
              label={
                <Box
                  direction="row"
                  justify="start"
                  align="center"
                  style={{ fontWeight: "bold" }}
                  fill
                >
                  <span style={{ marginLeft: "1rem" }}>
                    [{personListData.length}]
                  </span>
                  <span style={{ marginLeft: "1rem", marginRight: "auto" }}>
                    All
                  </span>
                  {hasGroups && (
                    // Show these option buttons if there are groups in the network
                    <React.Fragment>
                      <ToolTipButton
                        onClick={toggleShowNodesWithoutGroupsFunc}
                        icon={showNodesWithoutGroupsIcon}
                        tooltip={showNodesWithoutGroupsToolTip}
                      />
                      <ToolTipButton
                        onClick={toggleHideShowAll}
                        icon={showHideAllIcon}
                        tooltip={showHideAllToolTip}
                      />
                    </React.Fragment>
                  )}
                </Box>
              }
            >
              {personListData.length > 0 ? (
                <List
                  id={props.id}
                  data={personListData}
                  children={renderItem(true)}
                  ref={(el: any) => (listRef.current = el)}
                />
              ) : (
                <Box pad="medium">
                  <Text textAlign="center">Nothing here... yet!</Text>
                </Box>
              )}
            </AccordionPanel>

            {/* Render user-created groups */}
            {/* TODO: Render group lists */}
            {currentNetwork.relationshipGroups &&
              Object.entries(currentNetwork.relationshipGroups)
                // Sort each group by name in alphanumeric order
                .sort((e1, e2) =>
                  e1[1].name
                    .toLowerCase()
                    .localeCompare(e2[1].name.toLowerCase()),
                )

                .map((entry, index) => {
                  const [groupId, group] = entry
                  const peopleInGroup = personListData.filter((person) =>
                    group.personIds.includes(person.id),
                  )
                  const isEmpty = peopleInGroup.length === 0

                  // DO NOT render this accordion if the user this group doesn't contain the search value
                  const noSearchResults = isEmpty && topInput !== ""
                  if (noSearchResults) return null

                  // Function to toggle this person in group
                  const createTogglePersonInGroupFunc = (
                    personId: string,
                    isInGroup: boolean,
                  ) => async () => {
                    const doAdd = !isInGroup

                    try {
                      await dispatch(
                        togglePersonInGroup(
                          currentNetwork.id,
                          groupId,
                          personId,
                          doAdd,
                        ),
                      )
                    } catch (error) {
                      console.error(error)
                    }
                  }

                  // Function to delete the group
                  const handleDeleteGroup = async () => {
                    try {
                      const doDelete = window.confirm(
                        `Delete group: [${group.name}]? This action cannot be reversed.`,
                      )

                      // Stop if the user canceled the confirm prompt
                      if (!doDelete) return

                      // Delete the group
                      await dispatch(deleteGroup(currentNetwork.id, groupId))
                    } catch (error) {
                      console.error(error)
                    }
                  }

                  // Check in global filter groups state to see if this group is showing
                  let isGroupShowing = filterGroups[groupId]

                  // If the group isn't set in global state yet, show it by default
                  if (isGroupShowing === undefined) isGroupShowing = true

                  // Icons to show for showing states
                  const toggleFilterIcon = isGroupShowing ? (
                    <Icons.FormView color="accent-1" />
                  ) : (
                    <Icons.FormViewHide color="accent-1" />
                  )

                  // Toggle show/hide for this group
                  const handleToggleGroupFilter = async (
                    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
                  ) => {
                    // Stop event propagation -- this prevents the accordion from being clicked when the user clicks on the toggle button
                    e.stopPropagation()

                    try {
                      // Toggle the groups "showing" state
                      await dispatch(
                        toggleGroupFilter(groupId, !isGroupShowing),
                      )
                    } catch (error) {
                      console.error(error)
                    }
                  }

                  return (
                    <AccordionPanel
                      key={`group-${group.name}-${index}`}
                      style={{
                        height: "48px",
                        width: "100%",
                        backgroundColor: group.backgroundColor,
                        color: group.textColor,
                        filter:
                          isEmpty || !isGroupShowing // Dim the group accordion if it's empty or if it's hiding its nodes
                            ? "brightness(50%) saturate(50%)"
                            : undefined,
                      }}
                      label={
                        <Box
                          direction="row"
                          align="center"
                          justify="start"
                          fill
                        >
                          <span style={{ marginLeft: "1rem" }}>
                            [{peopleInGroup.length}]
                          </span>
                          <span style={{ marginLeft: "1rem" }}>
                            {group.name}
                          </span>
                          {
                            // Show the "show/hide" button IFF there are members in the group
                            !isEmpty && (
                              <Button
                                onClick={handleToggleGroupFilter}
                                icon={toggleFilterIcon}
                                color="dark-1"
                                margin={{ left: "auto" }}
                                hoverIndicator
                              />
                            )
                          }
                        </Box>
                      }
                    >
                      <Box pad="medium">
                        <Tabs>
                          <Tab title="View">
                            <List
                              data={peopleInGroup}
                              children={renderItem(false)}
                            />
                          </Tab>
                          <Tab title="Manage">
                            <Box gap="xsmall">
                              <Box direction="row" justify="end">
                                <ToolTipButton
                                  tooltip="Delete group"
                                  onClick={handleDeleteGroup}
                                  icon={<Icons.Trash color="status-critical" />}
                                />
                              </Box>
                              <Box background="light-1">
                                <SearchAndCheckMenu
                                  defaultOptions={personListData}
                                  idField="id"
                                  nameField="name"
                                  isCheckedFunction={(arg: IPerson) =>
                                    group.personIds.includes(arg.id)
                                  }
                                  toggleOption={createTogglePersonInGroupFunc}
                                />
                              </Box>
                            </Box>
                          </Tab>
                        </Tabs>
                      </Box>
                    </AccordionPanel>
                  )
                })}
          </Accordion>
        </Box>
      )}
    </React.Fragment>
  )
}

export default PersonMenu
