import { ActionCreator } from "redux"
import { AppThunk } from "../store"
import {
  IFocusOnPersonAction,
  IInitializePersonGroupList,
  IPersonIDWithActiveGroups,
  ISetUILoadingAction,
  ISetViewingSharedAction,
  IToggleGroupFilterAction,
  ITogglePersonOverlay,
  IToggleShareOverlayAction,
  IToggleShowNodesWithoutGroupsAction,
  IZoomToPersonAction,
  UserInterfaceActionTypes,
} from "./uiTypes"

// -== ACTION CREATORS ==- //
export const setUILoading: ActionCreator<ISetUILoadingAction> = (
  isLoading: boolean,
) => ({
  type: UserInterfaceActionTypes.LOADING,
  isLoading,
})

/**
 * Add a new Person to an existing Network
 * @param personId ID of the person to focus on. This person should exist in the currentNetwork state. A null person ID un-focuses from the current person.
 */
export const setPersonInFocus = (personId: string | null): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setUILoading(true))

    try {
      if (personId !== null) {
        const currentNetwork = getState().networks.currentNetwork
        if (!currentNetwork) throw new Error("No network selected.")

        const doesPersonExist = currentNetwork.personIds.some(
          (id) => id === personId,
        )
        if (!doesPersonExist) throw new Error("That person does not exist.")
      }

      const action: IFocusOnPersonAction = {
        type: UserInterfaceActionTypes.FOCUS_ON_PERSON_BY_ID,
        personId,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to focus on the Person */
      dispatch(setUILoading(false))
      throw error
    }
  }
}

export const togglePersonOverlay: ActionCreator<ITogglePersonOverlay> = (
  isOpen: boolean,
) => ({
  type: UserInterfaceActionTypes.TOGGLE_PERSON_OVERLAY,
  isOpen,
})

export const zoomToPerson: ActionCreator<IZoomToPersonAction> = (
  personId: string | null,
) => ({ type: UserInterfaceActionTypes.ZOOM_TO_PERSON, personId })

/* "Caches" a map of person IDs with an associated list of group IDs that are showing. 
      In global state. */
export const cachePersonGroupList: ActionCreator<IInitializePersonGroupList> = (
  groupIdsbyPersonId: IPersonIDWithActiveGroups[],
) => ({
  type: UserInterfaceActionTypes.INIT_PERSON_ACTIVE_GROUPS,
  groupIdsbyPersonId,
})

// Toggle a group's "showing" state
export const toggleGroupFilter: ActionCreator<IToggleGroupFilterAction> = (
  groupId: string,
  doShow: boolean,
) => ({
  type: UserInterfaceActionTypes.TOGGLE_GROUP_FILTER,
  groupId,
  doShow,
})

// Set the state determining whether the force-graph shows nodes without groups or not
export const toggleShowNodesWithoutGroups: ActionCreator<IToggleShowNodesWithoutGroupsAction> = (
  doShow: boolean,
) => ({
  type: UserInterfaceActionTypes.TOGGLE_SHOW_NODES_WITHOUT_GROUPS,
  doShow,
})

// Open/close the network sharing overlay
export const toggleShareOverlay: ActionCreator<IToggleShareOverlayAction> = (
  isOpen: boolean,
) => ({
  type: UserInterfaceActionTypes.TOGGLE_SHARE_OVERLAY,
  isOpen,
})

// Set viewing shared state -- whether the user is viewing a shared network or not
export const setViewingShared: ActionCreator<ISetViewingSharedAction> = (
  isViewingShared: boolean,
) => ({
  type: UserInterfaceActionTypes.SET_VIEWING_SHARED,
  isViewingShared,
})
