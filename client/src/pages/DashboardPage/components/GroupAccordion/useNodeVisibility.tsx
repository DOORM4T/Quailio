import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { IPerson } from "../../../../store/networks/networkTypes"
import { getNodeVisibilityMap } from "../../../../store/selectors/ui/getPersonNodeVisibility"
import { setNodeVisibility } from "../../../../store/ui/uiActions"

interface IProps {
  group: IPerson | "all"
  people: IPerson[]
}

export interface IVisibilityLists {
  all: IPerson[]
  visible: IPerson[]
  hidden: IPerson[]
}

function useGroupVisibility({ group, people }: IProps) {
  const dispatch = useDispatch()

  const nodeVisibilityMap = useSelector(getNodeVisibilityMap)
  const doShowGroup =
    group === "all" ? true : nodeVisibilityMap[group.id] !== false // Group is visible if true or undefined in the map

  const hasPerson = (person: IPerson) =>
    group === "all" ? true : group.relationships[person.id] !== undefined
  const peopleInGroup = people.filter(hasPerson)
  const visible = peopleInGroup.filter((p) => nodeVisibilityMap[p.id] !== false)
  const hidden = peopleInGroup.filter((p) => nodeVisibilityMap[p.id] === false)

  const [doShowAllPeople, setShowAllPeople] = useState(true)

  // Update show all state whenever all the people in the group are hidden or showing
  // This keeps the visibility icon updated for the group
  useEffect(() => {
    const allInGroupHidden = peopleInGroup.every(
      (p) => nodeVisibilityMap[p.id] === false,
    )

    if (!allInGroupHidden) return
    setShowAllPeople(false)
  }, [nodeVisibilityMap])

  useEffect(() => {
    const allInGroupVisible = peopleInGroup.every(
      (p) => nodeVisibilityMap[p.id] !== false,
    )

    if (!allInGroupVisible) return
    setShowAllPeople(true)
  }, [nodeVisibilityMap])

  const toggleAllNodeVisibility = async () => {
    const personIds = peopleInGroup.map((p) => p.id)
    dispatch(setNodeVisibility(personIds, !doShowAllPeople))
    setShowAllPeople((latestShowAll) => !latestShowAll)
  } // toggleNodes

  return {
    visibilityLists: {
      all: peopleInGroup,
      visible,
      hidden,
    },
    showing: {
      group: doShowGroup,
      all: doShowAllPeople,
    },
    toggleAllNodeVisibility,
  }
}

export default useGroupVisibility
