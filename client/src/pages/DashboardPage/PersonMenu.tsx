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
    currentNetwork,
    dispatch,
    filterablePeople,
    filterGroups,
    isViewingShared,
    renderItem,
    searchAddInput,
    SearchAddInputNode,
  } = usePersonMenu(props)

  // UI | Person lists by group
  const PersonListsByGroup: React.ReactNode = currentNetwork && (
    <Box fill style={{ overflowY: "auto" }}>
      <Accordion animate={false} multiple={true}>
        {/* Render the "All" group first */}
        {AllPeopleGroup}

        {/* Render user-created groups */}
        {currentNetwork.relationshipGroups &&
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
