import { useDispatch } from "react-redux"
import {
  connectPeople,
  disconnectPeople,
} from "../../../../store/networks/actions"
import {
  ICurrentNetwork,
  IPerson,
} from "../../../../store/networks/networkTypes"
import { setNodeVisibility } from "../../../../store/ui/uiActions"

interface IProps {
  currentNetwork: ICurrentNetwork
  group: IPerson | "all"
  doShowGroup: boolean
}

function useGroupAccordionFunctions({
  currentNetwork,
  group,
  doShowGroup,
}: IProps) {
  const dispatch = useDispatch()

  if (group === "all")
    return {
      changeGroupColorByField: null,
      handleTogglePersonInGroup: null,
      toggleGroupVisibility: null,
    }

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

  const toggleGroupVisibility = async () => {
    try {
      await dispatch(setNodeVisibility(group.id, !doShowGroup))
    } catch (error) {
      console.error(error)
    }
  } // toggleGroupVisibility

  return {
    handleTogglePersonInGroup,
    toggleGroupVisibility,
  }
}

export default useGroupAccordionFunctions
