import { useState } from "react"
import { useDispatch } from "react-redux"
import { IPerson } from "../../../../store/networks/networkTypes"
import { setNodeVisibility } from "../../../../store/ui/uiActions"

interface IProps {
  groups: IPerson[]
}
function useToggleAllGroups({ groups }: IProps) {
  const dispatch = useDispatch()

  const [isShowingAllGroups, setShowingAllGroups] = useState<boolean>(true)
  const toggleAllGroupVisibility = () => {
    if (!groups) return
    const groupIds = groups.map((g) => g.id)

    if (isShowingAllGroups) {
      // Hide all groups
      dispatch(setNodeVisibility(groupIds, false))
      setShowingAllGroups(false)
      return
    }

    // Otherwise, show all groups
    dispatch(setNodeVisibility(groupIds, true))
    setShowingAllGroups(true)
    return
  } // toggleHideShowAllGroups

  return { toggleAllGroupVisibility, isShowingAllGroups }
}

export default useToggleAllGroups
