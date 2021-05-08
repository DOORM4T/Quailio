import { AccordionPanel, Box, List, Tab, Tabs } from "grommet"
import * as Icons from "grommet-icons"
import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import SearchAndCheckMenu from "../../components/SearchAndCheckMenu"
import ToolTipButton from "../../components/ToolTipButton"
import { deleteGroup } from "../../store/networks/actions"
import {
  changeGroupColor,
  GroupColorField,
} from "../../store/networks/actions/changeGroupBackgroundColor"
import { renameGroup } from "../../store/networks/actions/renameGroup"
import { togglePersonInGroup } from "../../store/networks/actions/togglePersonInGroup"
import {
  ICurrentNetwork,
  IPerson,
  IRelationshipGroup,
} from "../../store/networks/networkTypes"
import { IApplicationState } from "../../store/store"
import {
  toggleGroupFilter,
  togglePersonVisibility,
} from "../../store/ui/uiActions"

interface IProps {
  key: string
  currentNetwork: ICurrentNetwork
  group: IRelationshipGroup
  groupId: string
  filterablePeople: IPerson[]
  filterGroups: {
    [groupId: string]: boolean
  }
  isViewingShared: boolean
  renderItem: (
    canSearch: boolean,
  ) => (person: IPerson, index: number) => React.ReactNode
}

const GroupAccordion: React.FC<IProps> = ({
  key,
  currentNetwork,
  group,
  groupId,
  filterablePeople,
  filterGroups,
  isViewingShared,
  renderItem,
}: IProps) => {
  const dispatch: Dispatch<any> = useDispatch()
  const [doShowAll, setShowAll] = useState(true)

  const hasPerson = (person: IPerson) => group.personIds.includes(person.id)
  const peopleInGroup = filterablePeople.filter(hasPerson)
  const isEmpty = peopleInGroup.length === 0
  let doShowGroup = filterGroups[groupId]
  if (doShowGroup === undefined) doShowGroup = true // Undefined showing state also means the group should show

  const visibilityMap = useSelector(
    (state: IApplicationState) => state.ui.personNodeVisibility,
  )
  const numPeopleVisible = peopleInGroup.reduce((count, person) => {
    const doCount = visibilityMap[person.id] !== false
    const toAdd = doCount ? 1 : 0
    return count + toAdd
  }, 0)

  // Update show all state whenever all the people in the group are hidden or showing
  // This keeps the visibility icon updated for the group
  useEffect(() => {
    const allInGroupHidden = peopleInGroup.every(
      (p) => visibilityMap[p.id] === false,
    )

    if (!allInGroupHidden) return
    setShowAll(false)
  }, [visibilityMap])

  useEffect(() => {
    const allInGroupVisible = peopleInGroup.every(
      (p) => visibilityMap[p.id] !== false,
    )

    if (!allInGroupVisible) return
    setShowAll(true)
  }, [visibilityMap])

  const handleTogglePersonInGroup = (
    personId: string,
    isInGroup: boolean,
  ) => async () => {
    const doAdd = !isInGroup

    try {
      await dispatch(
        togglePersonInGroup(currentNetwork.id, groupId, personId, doAdd),
      )
    } catch (error) {
      console.error(error)
    }
  } // handleTogglePersonInGroup

  const handleRenameGroup = async () => {
    try {
      const newName = window.prompt(`Rename [${group.name}] to:`)

      // Stop if the user didn't enter anything
      if (!newName) return

      // Rename the group in global state through a custom Redux function
      await dispatch(renameGroup(currentNetwork.id, groupId, newName))
    } catch (error) {
      console.error(error)
    }
  } //  handleDeleteGroup

  const changeGroupColorByField = (field: GroupColorField) => async () => {
    // Create a color picker input
    const colorInput = document.createElement("input")
    colorInput.type = "color"

    // Open the color picker
    colorInput.click()

    // Wait for the user to change the color
    const changeColor = () =>
      new Promise((resolve) => {
        colorInput.onchange = () => {
          resolve(colorInput.value)
        }
      })

    const newColor = await changeColor()
    colorInput.remove()

    // Update the color in global state using a custom Redux action
    try {
      await dispatch(
        changeGroupColor(
          groupId,
          currentNetwork.id,
          field, // Change backgroundColor or textColor
          newColor as string,
        ),
      )
    } catch (error) {
      console.error(error)
    }
  } // changeGroupColorByField

  const handleDeleteGroup = async () => {
    try {
      const doDelete = window.confirm(
        `Delete group: [${group.name}]? This action cannot be reversed.`,
      )

      // Stop if the user canceled the confirm prompt
      if (!doDelete) return

      // Delete the group from global state through a custom Redux function
      await dispatch(deleteGroup(currentNetwork.id, groupId))
    } catch (error) {
      console.error(error)
    }
  } // handleDeleteGroup

  const toggleGroupVisibility = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    // Stop event propagation -- this prevents the accordion from being clicked when the user clicks on the toggle button
    e.stopPropagation()

    try {
      // Toggle the groups "showing" state
      await dispatch(toggleGroupFilter(groupId, !doShowGroup))
    } catch (error) {
      console.error(error)
    }
  } // toggleGroupVisibility

  const groupAccordionStyles: React.CSSProperties = {
    height: "48px",
    width: "100%",
    backgroundColor: group.backgroundColor,
    color: group.textColor,
    filter: !doShowGroup // Dim the group accordion if it's empty or if it's hiding its nodes
      ? "brightness(0.5)"
      : undefined,
  } // groupAccordionStyles

  const toggleGroupVisibilityTooltip = doShowGroup
    ? "Click to hide group"
    : "Click to show group"

  const toggleGroupVisibilityIcon = doShowGroup ? (
    <Icons.Folder color="accent-1" />
  ) : (
    <Icons.Folder color="accent-1" />
  )

  const GroupVisibilityToggle = (
    <Box margin={{ left: "auto" }}>
      <ToolTipButton
        tooltip={toggleGroupVisibilityTooltip}
        onClick={toggleGroupVisibility}
        icon={toggleGroupVisibilityIcon}
      />
    </Box>
  )

  const toggleNodesIcon = doShowAll ? (
    <Icons.FormView color="accent-1" />
  ) : (
    <Icons.FormViewHide color="accent-1" />
  )

  const toggleNodesTooltip = doShowAll
    ? "Hide all in group"
    : "Show all in group"

  // Show or hide all nodes in the group
  const toggleNodes = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const togglePromise = peopleInGroup.map(({ id }) =>
      Promise.resolve(dispatch(togglePersonVisibility(id, !doShowAll))),
    )
    await Promise.all(togglePromise)

    setShowAll((latestShowAll) => !latestShowAll)
  } // toggleNodes

  const NodesVisibilityToggle = (
    <Box margin={{ left: "auto" }}>
      <ToolTipButton
        tooltip={toggleNodesTooltip}
        onClick={toggleNodes}
        icon={toggleNodesIcon}
      />
    </Box>
  )

  // UI | Label component for this group's Accordion
  const personCountLabel =
    "[" +
    (peopleInGroup.length > 0
      ? `${numPeopleVisible}/${peopleInGroup.length}`
      : "EMPTY") +
    "]"

  const GroupAccordionLabel: React.ReactNode = (
    <Box direction="row" align="center" justify="start" fill>
      <span style={{ marginLeft: "1rem" }}>{group.name}</span>
      {
        <Box direction="row" margin={{ left: "auto" }} align="center">
          <span>{personCountLabel}</span>
          {GroupVisibilityToggle}
          {NodesVisibilityToggle}
        </Box>
      }
    </Box>
  ) // END | GroupAccordionLabel

  // UI | Component with UI for managing this group
  const ManageGroupBox: React.ReactNode = (
    <Box gap="xsmall">
      {/* Buttons */}
      <Box direction="row" justify="end">
        <ToolTipButton
          tooltip="Rename group"
          onClick={handleRenameGroup}
          icon={<Icons.Tag color="brand" />}
        />
        <ToolTipButton
          tooltip="Change group background color"
          onClick={changeGroupColorByField("backgroundColor")}
          icon={<Icons.Paint color={group.backgroundColor} />}
        />
        <ToolTipButton
          tooltip="Change group text color"
          onClick={changeGroupColorByField("textColor")}
          icon={<Icons.TextAlignFull color={group.textColor} />}
        />
        <ToolTipButton
          tooltip="Delete group"
          onClick={handleDeleteGroup}
          icon={<Icons.Trash color="status-critical" />}
        />
      </Box>
      {/* Search-Checkbox Menu */}
      <Box background="light-1">
        <SearchAndCheckMenu
          defaultOptions={filterablePeople}
          idField="id"
          nameField="name"
          isCheckedFunction={(arg: IPerson) => group.personIds.includes(arg.id)}
          toggleOption={handleTogglePersonInGroup}
        />
      </Box>
    </Box>
  ) // END | ManageGroupBox

  const visiblePeople = peopleInGroup.filter(
    (p) => visibilityMap[p.id] !== false,
  )
  const hiddenPeople = peopleInGroup.filter(
    (p) => visibilityMap[p.id] === false,
  )

  return (
    <AccordionPanel
      key={key}
      style={groupAccordionStyles}
      label={GroupAccordionLabel}
    >
      <Box pad="medium">
        <Tabs>
          <Tab
            title={`All (${peopleInGroup.length})`}
            disabled={peopleInGroup.length === 0}
          >
            <List data={peopleInGroup} children={renderItem(false)} />
          </Tab>
          <Tab
            title={`Visible (${visiblePeople.length})`}
            disabled={visiblePeople.length === 0}
          >
            <List data={visiblePeople} children={renderItem(false)} />
          </Tab>

          <Tab
            title={`Hidden (${hiddenPeople.length})`}
            disabled={hiddenPeople.length === 0}
          >
            <List data={hiddenPeople} children={renderItem(false)} />
          </Tab>

          {!isViewingShared && <Tab title="Manage">{ManageGroupBox}</Tab>}
        </Tabs>
      </Box>
    </AccordionPanel>
  )
}

export default GroupAccordion
