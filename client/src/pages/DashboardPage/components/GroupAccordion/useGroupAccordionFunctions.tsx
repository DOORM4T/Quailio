import { useDispatch } from "react-redux"
import {
  connectPeople,
  disconnectPeople,
} from "../../../../store/networks/actions"
import {
  GroupColorField,
  setNodeColor,
} from "../../../../store/networks/actions/setNodeColor"
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
    changeGroupColorByField,
    handleTogglePersonInGroup,
    toggleGroupVisibility,
  }
}

export default useGroupAccordionFunctions
