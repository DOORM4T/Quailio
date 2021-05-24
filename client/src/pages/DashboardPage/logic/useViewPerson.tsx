import { useDispatch } from "react-redux"
import { ICurrentNetwork } from "../../../store/networks/networkTypes"
import {
  setPersonInFocus,
  togglePersonOverlay,
} from "../../../store/ui/uiActions"

function useViewPerson(currentNetwork: ICurrentNetwork | null) {
  const dispatch = useDispatch()

  const viewPerson = (id: string) => async () => {
    if (!currentNetwork) return
    const person = currentNetwork.people.find((p) => p.id === id)
    if (!person) return

    // Focus on the person's info and open the content overlay
    try {
      await dispatch(setPersonInFocus(person.id))
      dispatch(togglePersonOverlay(true))
    } catch (error) {
      console.error(error)
    }
  } // END | viewPerson

  return { viewPerson }
}

export default useViewPerson
