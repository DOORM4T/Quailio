import { Box } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import SearchAndCheckMenu from "../../../components/SearchAndCheckMenu"
import ToolTipButton from "../../../components/ToolTipButton"
import { deleteGroup } from "../../../store/networks/actions"
import {
  changeGroupColor,
  GroupColorField,
} from "../../../store/networks/actions/changeGroupBackgroundColor"
import { renameGroup } from "../../../store/networks/actions/renameGroup"
import { togglePersonInGroup } from "../../../store/networks/actions/togglePersonInGroup"
import {
  ICurrentNetwork,
  IPerson,
  IRelationshipGroup,
} from "../../../store/networks/networkTypes"
import { toggleGroupFilter } from "../../../store/ui/uiActions"

interface IProps {
  currentNetwork: ICurrentNetwork
  dispatch: React.Dispatch<any>
  group: IRelationshipGroup
  groupId: string
  filterablePeople: IPerson[]
  filterGroups: {
    [groupId: string]: boolean
  }
  searchAddInput: string
}

// NOT a custom hook -- just processes data to create accordion content
const getGroupAccordionContent = ({
  currentNetwork,
  dispatch,
  group,
  groupId,
  filterablePeople,
  filterGroups,
  searchAddInput,
}: IProps) => {
  // VARS | Filter in people in the group
  const peopleInGroup = filterablePeople.filter((person) =>
    group.personIds.includes(person.id),
  )
  const isEmpty = peopleInGroup.length === 0

  // VARS | Check in global filter groups state to see if this group is showing
  let isGroupShowing = filterGroups[groupId]

  // VARS | If the group isn't set in global state yet, show it by default
  if (isGroupShowing === undefined) isGroupShowing = true

  // DO NOT render this accordion if the user this group doesn't contain the search value
  const noSearchResults = isEmpty && searchAddInput !== ""
  if (noSearchResults) return null

  // FUNCTION | Creates a closure function to toggle a person in the group
  const togglePersonInGroupClosure = (
    personId: string,
    isInGroup: boolean,
  ) => async () => {
    // Toggle the boolean
    const doAdd = !isInGroup

    // Toggle the person in the group's global state through a custom Redux action
    try {
      await dispatch(
        togglePersonInGroup(currentNetwork.id, groupId, personId, doAdd),
      )
    } catch (error) {
      console.error(error)
    }
  } // END | togglePersonInGroupCLosure

  // FUNCTION | Function to rename this group
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
  } // END | handleDeleteGroup

  // FUNCTION | Change the group's background or text color
  const changeGroupColorClosure = (field: GroupColorField) => async () => {
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
  }

  // FUNCTION | Function to delete this group
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
  } // END | handleDeleteGroup

  // FUNCTION | Toggle show/hide for this group
  const handleToggleGroupFilter = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    // Stop event propagation -- this prevents the accordion from being clicked when the user clicks on the toggle button
    e.stopPropagation()

    try {
      // Toggle the groups "showing" state
      await dispatch(toggleGroupFilter(groupId, !isGroupShowing))
    } catch (error) {
      console.error(error)
    }
  } // END | handleToggleGroupFilter

  // STYLE | Styles for the group Accordion
  const groupAccordionStyles: React.CSSProperties = {
    height: "48px",
    width: "100%",
    backgroundColor: group.backgroundColor,
    color: group.textColor,
    filter:
      isEmpty || !isGroupShowing // Dim the group accordion if it's empty or if it's hiding its nodes
        ? "brightness(50%) saturate(50%)"
        : undefined,
  } // END | groupAccordionStyles

  const toggleGroupVisibilityTooltip = isGroupShowing
    ? "Click to hide group"
    : "Click to show group"

  const toggleGroupVisibilityIcon = isGroupShowing ? (
    <Icons.Folder color="accent-1" />
  ) : (
    <Icons.Folder color="accent-1" />
  )

  const GroupVisibilityToggle = (
    <Box margin={{ left: "auto" }}>
      <ToolTipButton
        tooltip={toggleGroupVisibilityTooltip}
        onClick={handleToggleGroupFilter}
        icon={toggleGroupVisibilityIcon}
      />
    </Box>
  )

  // UI | Label component for this group's Accordion
  const GroupAccordionLabel: React.ReactNode = (
    <Box direction="row" align="center" justify="start" fill>
      <span style={{ marginLeft: "1rem" }}>[{peopleInGroup.length}]</span>
      <span style={{ marginLeft: "1rem" }}>{group.name}</span>
      {
        // Show the "show/hide" button IFF there are members in the group
        !isEmpty && GroupVisibilityToggle
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
          onClick={changeGroupColorClosure("backgroundColor")}
          icon={<Icons.Paint color={group.backgroundColor} />}
        />
        <ToolTipButton
          tooltip="Change group text color"
          onClick={changeGroupColorClosure("textColor")}
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
          toggleOption={togglePersonInGroupClosure}
        />
      </Box>
    </Box>
  ) // END | ManageGroupBox

  return {
    GroupAccordionLabel,
    ManageGroupBox,
    groupAccordionStyles,
    peopleInGroup,
  }
}

export default getGroupAccordionContent
