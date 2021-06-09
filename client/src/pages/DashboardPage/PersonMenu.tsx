import { Accordion, Box } from "grommet"
import React, { useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import SearchInput from "../../components/SearchInput"
import { ICurrentNetwork, IPerson } from "../../store/networks/networkTypes"
import { getPersonInFocusId } from "../../store/selectors/ui/getPersonInFocusData"
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

  const personInFocus = useSelector(getPersonInFocusId)
  const searchRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    function find(e: KeyboardEvent) {
      if (!e.ctrlKey || e.key !== "f") return
      if (personInFocus !== null) return
      e.preventDefault()
      searchRef.current?.focus()
      searchRef.current?.select()
    }
    window.removeEventListener("keydown", find)
    window.addEventListener("keydown", find)

    return () => {
      window.removeEventListener("keydown", find)
    }
  }, [personInFocus])

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
      <Box
        direction="row"
        align="center"
        pad="small"
        gap="none"
        height={SEARCH_INPUT_HEIGHT}
      >
        <SearchInput
          value={search.searchInput}
          isSearching={search.isSearching}
          onClick={(e) => e.currentTarget.select()}
          handleShortKeys={search.handleSearchInputShortkeys}
          handleChange={search.handleSearchChange}
          clearSearch={search.clearSearch}
          ref={searchRef}
        />
      </Box>
      {PersonListsByGroup}
    </Box>
  )
}

export default PersonMenu
