import { Accordion, Box, Stack, TextInput } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"
import ToolTipButton from "../../components/ToolTipButton"
import { ICurrentNetwork, IPerson } from "../../store/networks/networkTypes"
import GroupAccordion from "./components/GroupAccordion"
import usePersonMenu, { SEARCH_INPUT_HEIGHT } from "./logic/usePersonMenu"

export interface IPersonMenuProps {
  currentNetwork: ICurrentNetwork
  isSmall: boolean
}

const PersonMenu: React.FC<IPersonMenuProps> = ({
  currentNetwork,
  isSmall,
}) => {
  const { filterablePeople, isViewingShared, renderItem, search } =
    usePersonMenu({ currentNetwork })

  const groupNodes = currentNetwork?.people.filter((p) => p.isGroup) || []
  const doShowGroups = groupNodes.length > 0

  const sortGroupsByName = (g1: IPerson, g2: IPerson) =>
    g1.name.toLowerCase().localeCompare(g2.name.toLowerCase())

  const renderGroupAccordion = (group: IPerson, index: number) => {
    if (!currentNetwork) return null
    const key = `group-${group.name}-${index}`

    return (
      <GroupAccordion
        key={key}
        currentNetwork={currentNetwork}
        group={group}
        people={filterablePeople}
        isViewingShared={isViewingShared}
        search={search.searchInput}
        renderItem={renderItem}
      />
    )
  }

  const SearchInput: React.ReactNode = (
    <Box
      direction="row"
      align="center"
      pad="small"
      gap="none"
      height={SEARCH_INPUT_HEIGHT}
    >
      <Stack anchor="right" style={{ width: "100%" }}>
        <TextInput
          value={search.searchInput}
          placeholder="Search"
          onChange={search.handleSearchChange}
          onKeyUp={search.handleSearchInputShortkeys}
          onClick={(e) => e.currentTarget.select()}
          width={`${isViewingShared ? "100%" : "75%"}`}
          style={{ fontSize: "12px" }}
        />
        {search.isSearching && (
          <ToolTipButton
            tooltip="Clear search"
            icon={<Icons.Close color="status-critical" />}
            aria-label="Clear search"
            onClick={search.clearSearch}
            buttonStyle={SearchInputStyles}
          />
        )}
      </Stack>
    </Box>
  ) // SearchInput

  // UI | Person lists by group
  const PersonListsByGroup: React.ReactNode = currentNetwork && (
    <Box
      height={`calc(100% - ${SEARCH_INPUT_HEIGHT})`}
      overflow={{ vertical: "auto" }}
    >
      <Accordion animate={false} multiple={true}>
        {/* Render the "All" group first */}
        <GroupAccordion
          currentNetwork={currentNetwork}
          group="all"
          people={filterablePeople}
          isViewingShared={isViewingShared}
          renderItem={renderItem}
        />

        {/* Render user-created groups */}
        {doShowGroups &&
          groupNodes.sort(sortGroupsByName).map(renderGroupAccordion)}
      </Accordion>
    </Box>
  )

  return (
    <Box
      direction="column"
      justify="start"
      align="stretch"
      width="large"
      height={isSmall ? "50%" : "100%"}
    >
      {SearchInput}
      {PersonListsByGroup}
    </Box>
  )
}

export default PersonMenu

const SearchInputStyles = {
  background: "transparent",
  cursor: "pointer",
  border: "none",
  width: 32,
  height: 32,
  display: "grid",
  placeItems: "center",
  marginRight: "1rem",
  padding: "1px 0 0 0",
}
