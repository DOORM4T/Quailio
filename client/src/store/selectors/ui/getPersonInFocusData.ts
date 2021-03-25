import { createSelector } from "reselect"
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

/* Get derived data */

/* Individual selectors */
const selectors = [getPersonInFocusData]

export const getPersonInFocusName = createSelector(
  selectors,
  (person) => person?.name || null,
)
export const getPersonInFocusId = createSelector(
  selectors,
  (person) => person?.id || null,
)
export const getPersonInFocusRelationships = createSelector(
  selectors,
  (person) => person?.relationships || {},
)
export const getPersonInFocusThumbnailURL = createSelector(
  selectors,
  (person) => person?.thumbnailUrl || null,
)
