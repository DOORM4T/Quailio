import { AccordionPanel, Box, Image, List, Tab, Tabs } from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch, useEffect, useRef } from "react"
import { useDispatch } from "react-redux"
import SearchAndCheckMenu from "../../../../components/SearchAndCheckMenu"
import ToolTipButton from "../../../../components/ToolTipButton"
import {
  ICurrentNetwork,
  IPerson,
} from "../../../../store/networks/networkTypes"
import { zoomToPerson } from "../../../../store/ui/uiActions"
import useViewPerson from "../../logic/useViewPerson"
import useGroupAccordionFunctions from "./useGroupAccordionFunctions"
import useGroupVisibility from "./useNodeVisibility"

interface IProps {
  currentNetwork: ICurrentNetwork
  group: IPerson // a group is a person whose .isGroup is true
  people: IPerson[]
  isViewingShared: boolean
  renderItem: (
    canSearch: boolean,
  ) => (person: IPerson, index: number) => React.ReactNode
  [key: string]: any
}

/**
 * 1. Toggle node visibility
 * 2. Toggle group visibility
 * 3. Change group background and text colors
 * 4. Display tabs with nodes in 3 categories (All, Visible, Hidden)
 */
const GroupAccordion: React.FC<IProps> = (props) => {
  const { currentNetwork, group, people, isViewingShared, renderItem } = props

  const dispatch: Dispatch<any> = useDispatch()

  const { visibilityLists, showing, toggleAllNodeVisibility } =
    useGroupVisibility({
      group,
      people,
    })

  const {
    changeGroupColorByField,
    handleTogglePersonInGroup,
    toggleGroupVisibility,
  } = useGroupAccordionFunctions({
    currentNetwork,
    group,
    doShowGroup: showing.group,
  })

  const accordionRef = useRef<HTMLDivElement | null>(null)
  // Make the accordion header sticky
  // This is a hacky solution, but Grommet's AccordionPanel style prop doesn't style the right element to make the accordion sticky
  useEffect(() => {
    if (!accordionRef.current) return

    const actualAccordionLabel = accordionRef.current.querySelector(
      "[role='tab']",
    ) as HTMLButtonElement

    if (!actualAccordionLabel) return
    actualAccordionLabel.style.position = "sticky"
    actualAccordionLabel.style.top = "0px"
  }, [accordionRef])

  const groupAccordionStyles: React.CSSProperties = {
    height: "48px",
    width: "100%",
    backgroundColor: "#222",
    color: "#ddd",
    filter: !showing.group // Dim the group accordion if it's empty or if it's hiding its nodes
      ? "brightness(0.5)"
      : undefined,
    opacity: 1,
  } // groupAccordionStyles

  const GroupVisibilityToggle = (
    <Box margin={{ left: "auto" }} background="dark-1">
      <ToolTipButton
        onClick={(e) => {
          e.stopPropagation()
          toggleGroupVisibility(e)
        }}
        tooltip={showing.group ? "Click to hide group" : "Click to show group"}
        icon={
          showing.group ? (
            <Icons.Folder color="status-ok" />
          ) : (
            <Icons.Folder color="status-critical" />
          )
        }
      />
    </Box>
  ) // GroupVisibilityToggle

  const NodesVisibilityToggle = (
    <Box margin={{ left: "auto" }} background="dark-1">
      <ToolTipButton
        tooltip={showing.allPeople ? "Hide all in group" : "Show all in group"}
        onClick={(e) => {
          e.stopPropagation()
          toggleAllNodeVisibility(e)
        }}
        icon={
          showing.allPeople ? (
            <Icons.FormView color="accent-1" />
          ) : (
            <Icons.FormViewHide color="accent-1" />
          )
        }
      />
    </Box>
  ) // NodesVisibilityToggle

  const personCountLabel =
    "[" +
    (visibilityLists.allPeople.length > 0
      ? `${visibilityLists.visiblePeople.length}/${visibilityLists.allPeople.length}`
      : "EMPTY") +
    "]"

  const { viewPerson } = useViewPerson(currentNetwork)
  const GroupThumbnail = (
    <Box
      onClick={(e) => {
        e.stopPropagation()
        viewPerson(group.id)()
      }} // Open the person overlay for the group when clicked
      onMouseEnter={() => {
        dispatch(zoomToPerson(group.id))
      }} // Set the "zoomed-in person" in global state. The force-graph will zoom in on this group's node
      onMouseLeave={() => dispatch(zoomToPerson(null))}
      align="center"
      justify="center"
      style={{
        margin: "0 1rem",
        backgroundColor: "#ddd",
        overflow: "hidden",
        width: 32,
        height: 32,
        borderRadius: 4,
      }}
    >
      {group.thumbnailUrl ? (
        <Image src={group.thumbnailUrl} fit="cover" />
      ) : (
        <Icons.Folder color="dark-1" />
      )}
    </Box>
  ) // GroupThumbnail

  const GroupAccordionLabel: React.ReactNode = (
    <Box
      direction="row"
      align="center"
      justify="start"
      fill
      aria-label="Select person"
      style={{
        backgroundColor: group.backgroundColor || "#ddd",
        color: group.textColor || "#222",
      }}
    >
      <Box direction="row" width="60%">
        {GroupThumbnail}
        <span
          style={{
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {group.name}
        </span>
      </Box>
      {
        <Box direction="row" margin={{ left: "auto" }} align="center">
          <span style={{ marginRight: "1rem" }}>{personCountLabel}</span>
          {GroupVisibilityToggle}
          {NodesVisibilityToggle}
        </Box>
      }
    </Box>
  ) // GroupAccordionLabel

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
      <Box background="light-1" height="medium">
        <SearchAndCheckMenu
          defaultOptions={people.filter((p) => p.id !== group.id)} // CANNOT add a group to itself
          idField="id"
          nameField="name"
          isCheckedFunction={(arg: IPerson) =>
            group.relationships[arg.id] !== undefined
          }
          toggleOption={handleTogglePersonInGroup}
        />
      </Box>
    </Box>
  ) // ManageGroupBox

  return (
    <AccordionPanel
      style={groupAccordionStyles}
      label={GroupAccordionLabel}
      ref={accordionRef}
      {...props}
    >
      <Box pad="medium">
        <Tabs>
          <Tab
            title={`All (${visibilityLists.allPeople.length})`}
            disabled={visibilityLists.allPeople.length === 0}
          >
            <List
              data={visibilityLists.allPeople}
              children={renderItem(false)}
            />
          </Tab>
          <Tab
            title={`Visible (${visibilityLists.visiblePeople.length})`}
            disabled={visibilityLists.visiblePeople.length === 0}
          >
            <List
              data={visibilityLists.visiblePeople}
              children={renderItem(false)}
            />
          </Tab>

          <Tab
            title={`Hidden (${visibilityLists.hiddenPeople.length})`}
            disabled={visibilityLists.hiddenPeople.length === 0}
          >
            <List
              data={visibilityLists.hiddenPeople}
              children={renderItem(false)}
            />
          </Tab>

          {!isViewingShared && <Tab title="Manage">{ManageGroupBox}</Tab>}
        </Tabs>
      </Box>
    </AccordionPanel>
  )
}

export default GroupAccordion
