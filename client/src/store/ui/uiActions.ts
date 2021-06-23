import { ActionCreator } from "redux"
import { AppThunk } from "../store"
import {
  IFocusOnPersonAction,
  IInitializePersonGroupList,
  IPathContent as IPathOverlayContent,
  IPersonIDWithActiveGroups,
  IPopFromStackAction,
  IPushToStackAction,
  IResetUIAction,
  ISelectNodesAction,
  ISetNodeVisibilityAction,
  ISetPathContentAction,
  ISetSmallModeAction,
  ISetToolbarAction,
  ISetUILoadingAction,
  ISetViewingSharedAction,
  IStackAction,
  ITogglePersonOverlay,
  IToggleShareOverlayAction,
  IZoomToPersonAction,
  StackActionTypes,
  StackName,
  ToolbarAction,
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

// Toggle a (person/group) node's visibility
export const setNodeVisibility = (
  nodeIds: string | string[],
  doShow: boolean,
): ISetNodeVisibilityAction => ({
  type: UserInterfaceActionTypes.SET_NODE_VISIBILITY,
  nodeIds,
  isVisible: doShow,
})

// Clear UI global state
export const resetUI = (): IResetUIAction => ({
  type: UserInterfaceActionTypes.RESET_UI,
})

export const setToolbarAction = (
  toolbarAction: ToolbarAction,
): ISetToolbarAction => ({
  type: UserInterfaceActionTypes.SET_TOOLBAR_ACTION,
  toolbarAction,
})

export const setSmallMode = (isSmall: boolean): ISetSmallModeAction => ({
  type: UserInterfaceActionTypes.SET_SMALL_MODE,
  isSmall,
})

export const selectNodes = (selectedNodeIds: string[]): ISelectNodesAction => ({
  type: UserInterfaceActionTypes.SELECT_NODES,
  selectedNodeIds,
})

export const setPathOverlayContent = (
  paths: IPathOverlayContent | null,
): ISetPathContentAction => ({
  type: UserInterfaceActionTypes.SET_PATH_CONTENT,
  paths,
})

export const pushActionToStack = (
  stack: StackName,
  actions: IStackAction[],
): IPushToStackAction => {
  return { type: UserInterfaceActionTypes.PUSH_TO_STACK, stack, actions }
}

export const popActionFromStack =
  (stack: StackName): AppThunk =>
  (dispatch, getState) => {
    // This action performs the action that will be popped
    // The reducer actually pops the action from the global undo/redo stack
    const stackFieldName = stack === "undo" ? "undoStack" : "redoStack"
    const stackField = getState().ui[stackFieldName]
    if (stackField.length === 0)
      throw new Error(`No items to pop from ${stackFieldName}`)

    const stackActions = stackField[stackField.length - 1]
    console.log(stackActions)

    // TODO: Perform popped action

    // TODO: Push to opposite stack
    // TODO: Create "opposite StackActions" array
    // const oppositeStackActions: IStackAction[] = []
    for (const stackAction of stackActions) {
      console.table(stackAction)
      switch (stackAction.type) {
        case StackActionTypes.CREATE: {
          console.log("DO CREATE")
          break
        }

        case StackActionTypes.DELETE: {
          console.log("DO DELETE")
          break
        }
      }
    }

    const action: IPopFromStackAction = {
      type: UserInterfaceActionTypes.POP_FROM_STACK,
      stack,
    }
    return dispatch(action)
  }
