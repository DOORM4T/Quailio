import { IPerson } from "../../networks/networkTypes"
import { IApplicationState } from "../../store"

/* Get the person data object corresponding to the currentPersonInFocus ID */
export const getPersonInFocusData = (
  state: IApplicationState,
): IPerson | null => {
  const personInFocusId = state.ui.personInFocus
  if (!personInFocusId) return null

  const person = state.networks.currentNetwork?.people.find(
    (p) => p.id === personInFocusId,
  )
  if (!person) return null

  return person
}
