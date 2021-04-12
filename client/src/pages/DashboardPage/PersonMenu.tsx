import { Accordion, AccordionPanel, Box, List, Tab, Tabs } from "grommet"
import React from "react"
import { IPerson } from "../../store/networks/networkTypes"
import getGroupAccordionContent from "./logic/getGroupAccordionContent"
import usePersonMenu from "./logic/usePersonMenu"

export interface IPersonMenuProps {
  people: IPerson[]
}

const PersonMenu: React.FC<IPersonMenuProps> = (props) => {
  const {
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
  } = usePersonMenu(props)

  const [isAllGroupOpen, setAllGroupOpen] = React.useState(false)

  const openAllGroupWhenSearching = (activeIndexes: number[]) => {
    setAllGroupOpen(activeIndexes.includes(0))
  }

  // EFFECT | Open the All Group accordion when searching
  React.useEffect(() => {
    const shouldToggleAllGroup =
      (isSearching && !isAllGroupOpen) || (!isSearching && isAllGroupOpen)
    if (!shouldToggleAllGroup) return

    const allGroupButtonLabel = allGroupButtonLabelRef.current?.querySelector(
      "button",
    )
    if (!allGroupButtonLabel) return

    allGroupButtonLabel.click()
  }, [isSearching]) // EFFECT | Triggers when isSearching changes

  // UI | Person lists by group
  const PersonListsByGroup: React.ReactNode = currentNetwork && (
    <Box fill style={{ overflowY: "auto" }}>
      <Accordion
        animate={false}
        multiple={true}
        onActive={openAllGroupWhenSearching}
      >
        {/* Render the "All" group first (active index 0)*/}
        {AllPeopleGroup}

        {/* Render user-created groups */}
        {!isSearching &&
          currentNetwork.relationshipGroups &&
          Object.entries(currentNetwork.relationshipGroups)
            // Sort each group by name in alphanumeric order
            .sort((e1, e2) =>
              e1[1].name.toLowerCase().localeCompare(e2[1].name.toLowerCase()),
            )

            // Render Accordion Panels for each group
            .map((entry, index) => {
              // Destructure the key (groupId) and value (group content) from the entry
              const [groupId, group] = entry
              const groupAccordionKey = `group-${group.name}-${index}`
              const accordionContent = getGroupAccordionContent({
                currentNetwork,
                dispatch,
                group,
                groupId,
                filterablePeople,
                filterGroups,
                searchAddInput,
              })

              if (!accordionContent) return null
              const {
                GroupAccordionLabel,
                ManageGroupBox,
                groupAccordionStyles,
                peopleInGroup,
              } = accordionContent

              return (
                <AccordionPanel
                  key={groupAccordionKey}
                  style={groupAccordionStyles}
                  label={GroupAccordionLabel}
                >
                  <Box pad="medium">
                    <Tabs>
                      <Tab title="View">
                        <List
                          data={peopleInGroup}
                          children={renderItem(false)}
                        />
                      </Tab>

                      {!isViewingShared && (
                        <Tab title="Manage">{ManageGroupBox}</Tab>
                      )}
                    </Tabs>
                  </Box>
                </AccordionPanel>
              )
            })}
      </Accordion>
    </Box>
  )

  return (
    <React.Fragment>
      {SearchAddInputNode}
      {PersonListsByGroup}
    </React.Fragment>
  )
}

export default PersonMenu
