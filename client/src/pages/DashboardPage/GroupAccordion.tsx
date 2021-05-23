import { AccordionPanel, Box, List, Tab, Tabs } from "grommet"
import * as Icons from "grommet-icons"
import React, { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import SearchAndCheckMenu from "../../components/SearchAndCheckMenu"
import ToolTipButton from "../../components/ToolTipButton"
import { connectPeople, disconnectPeople } from "../../store/networks/actions"
import {
  GroupColorField,
  setNodeColor,
} from "../../store/networks/actions/setNodeColor"
import { ICurrentNetwork, IPerson } from "../../store/networks/networkTypes"
import { IApplicationState } from "../../store/store"
import {
  toggleGroupFilter,
  togglePersonVisibility,
} from "../../store/ui/uiActions"

interface IProps {
  key: string
  currentNetwork: ICurrentNetwork
  group: IPerson // a group is a person whose .isGroup is true
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
  filterablePeople,
  filterGroups,
  isViewingShared,
  renderItem,
}: IProps) => {
  const dispatch: Dispatch<any> = useDispatch()
  const [doShowAll, setShowAll] = useState(true)

  const hasPerson = (person: IPerson) =>
    group.relationships[person.id] !== undefined
  const peopleInGroup = filterablePeople.filter(hasPerson) // People in a group are people connected to the group
  let doShowGroup = filterGroups[group.id]
  if (doShowGroup === undefined) doShowGroup = true // Undefined showing state also means the group should show
  const accordionRef = useRef<HTMLDivElement | null>(null)

  // Make the accordion header sticky
  // This is a hacky solution, but Grommet's AccordionPanel style prop doesn't style the right element to make the accordion sticky
  useEffect(() => {
    if (!accordionRef.current) return

    const actualAccordionLabel = accordionRef.current.querySelector(
      "[role='tab']",
    ) as HTMLButtonElement
    console.log(actualAccordionLabel)

    if (!actualAccordionLabel) return
    actualAccordionLabel.style.position = "sticky"
    actualAccordionLabel.style.top = "0px"
  }, [accordionRef])

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

  const handleTogglePersonInGroup =
    (personId: string, isInGroup: boolean) => async () => {
      const doAdd = !isInGroup

      try {
        if (doAdd) {
          await dispatch(
            connectPeople(currentNetwork.id, {
              p1Id: group.id,
              p2Id: personId,
            }),
          )
        } else {
          await dispatch(
            disconnectPeople(currentNetwork.id, {
              p1Id: group.id,
              p2Id: personId,
            }),
          )
        }
      } catch (error) {
        console.error(error)
      }
    } // handleTogglePersonInGroup

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
        setNodeColor(
          currentNetwork.id,
          group.id,
          field, // Change backgroundColor or textColor
          newColor as string,
        ),
      )
    } catch (error) {
      console.error(error)
    }
  } // changeGroupColorByField

  const toggleGroupVisibility = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    // Stop event propagation -- this prevents the accordion from being clicked when the user clicks on the toggle button
    e.stopPropagation()

    try {
      // Toggle the groups "showing" state
      await dispatch(toggleGroupFilter(group.id, !doShowGroup))
    } catch (error) {
      console.error(error)
    }
  } // toggleGroupVisibility

  const groupAccordionStyles: React.CSSProperties = {
    height: "48px",
    width: "100%",
    backgroundColor: group.backgroundColor || "white",
    color: group.textColor || "black",
    filter: !doShowGroup // Dim the group accordion if it's empty or if it's hiding its nodes
      ? "brightness(0.5)"
      : undefined,
    opacity: 1,
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
          tooltip="Change group background color"
          onClick={changeGroupColorByField("backgroundColor")}
          icon={<Icons.Paint color={group.backgroundColor} />}
        />
        <ToolTipButton
          tooltip="Change group text color"
          onClick={changeGroupColorByField("textColor")}
          icon={<Icons.TextAlignFull color={group.textColor} />}
        />
      </Box>
      {/* Search-Checkbox Menu */}
      <Box background="light-1">
        <SearchAndCheckMenu
          defaultOptions={filterablePeople.filter((p) => p.id !== group.id)} // CANNOT add a group to itself
          idField="id"
          nameField="name"
          isCheckedFunction={(arg: IPerson) =>
            group.relationships[arg.id] !== undefined
          }
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
      ref={accordionRef}
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
