import { Reducer } from "redux"
import {
  ActionStack,
  IActiveGroupsByPersonId,
  IUserInterfaceState,
  UserInterfaceActions,
  UserInterfaceActionTypes,
} from "./uiTypes"

const initialState: IUserInterfaceState = {
  isLoading: false,
  isPersonEditMenuOpen: false,
  personInFocus: null,
  personInZoom: null,
  activeGroupsByPersonId: {},
  isShareMenuOpen: false,
  isViewingShared: false,
  personNodeVisibility: {},
  toolbarAction: "VIEW",
  isSmallMode: false,
  selectedNodeIds: [],
  pathContent: null,
  undoStack: [],
  redoStack: [],
}

export const uiReducer: Reducer<IUserInterfaceState, UserInterfaceActions> = (
  state = initialState,
  action,
): IUserInterfaceState => {
  switch (action.type) {
    case UserInterfaceActionTypes.LOADING: {
      return { ...state, isLoading: action.isLoading }
    }

    case UserInterfaceActionTypes.FOCUS_ON_PERSON_BY_ID: {
      return {
        ...state,
        personInFocus: action.personId,
        isLoading: false,
      }
    }

    case UserInterfaceActionTypes.TOGGLE_PERSON_OVERLAY: {
      return {
        ...state,
        isPersonEditMenuOpen: action.isOpen,
      }
    }

    case UserInterfaceActionTypes.ZOOM_TO_PERSON: {
      return {
        ...state,
        personInZoom: action.personId,
      }
    }

    // State for caching person nodes whose groups are showing
    case UserInterfaceActionTypes.INIT_PERSON_ACTIVE_GROUPS: {
      // Map of active groups by person ID
      const activeGroupsByPersonId: IActiveGroupsByPersonId = {}

      // Place each personId-activeGroupIds object into the map
      action.groupIdsbyPersonId.forEach((obj) => {
        activeGroupsByPersonId[obj.personId] = obj.activeGroupIds
      })

      return {
        ...state,
        activeGroupsByPersonId,
      }
    }

    case UserInterfaceActionTypes.TOGGLE_SHARE_OVERLAY: {
      return {
        ...state,
        isShareMenuOpen: action.isOpen,
      }
    }

    case UserInterfaceActionTypes.SET_VIEWING_SHARED: {
      return {
        ...state,
        isViewingShared: action.isViewingShared,
      }
    }

    case UserInterfaceActionTypes.SET_NODE_VISIBILITY: {
      const personNodeVisibility = { ...state.personNodeVisibility }
      let toSet: string[] = []
      toSet = toSet.concat(action.nodeIds)
      for (const id of toSet) personNodeVisibility[id] = action.isVisible

      return {
        ...state,
        personNodeVisibility,
      }
    }

    case UserInterfaceActionTypes.RESET_UI: {
      return {
        ...state,
        activeGroupsByPersonId: {},
        isPersonEditMenuOpen: false,
        isShareMenuOpen: false,
        personNodeVisibility: {},
        personInFocus: null,
        personInZoom: null,
        selectedNodeIds: [],
        pathContent: null,
        undoStack: [],
        redoStack: [],
      }
    }

    case UserInterfaceActionTypes.SET_TOOLBAR_ACTION: {
      return {
        ...state,
        toolbarAction: action.toolbarAction,
      }
    }

    case UserInterfaceActionTypes.SET_SMALL_MODE: {
      return {
        ...state,
        isSmallMode: action.isSmall,
      }
    }

    case UserInterfaceActionTypes.SELECT_NODES: {
      return {
        ...state,
        selectedNodeIds: action.selectedNodeIds,
      }
    }

    case UserInterfaceActionTypes.SET_PATH_CONTENT: {
      return {
        ...state,
        pathContent: action.paths,
      }
    }

    // Undo-Redo Functionality
    case UserInterfaceActionTypes.PUSH_TO_UNDO_STACK: {
      // NOT using concat here since it incorrectly puts each item in the StackAction array into the array
      // We want the stacks to look like this, since users may perform batch actions: [[MOVE, MOVE, ..., MOVE], [CREATE], [DELETE]...]
      // Concat would make it lookl like this: [MOVE, MOVE, ..., MOVE, CREATE, DELETE...]
      const updatedUndoStack = [...state.undoStack]
      updatedUndoStack.push(action.actions)

      return {
        ...state,
        undoStack: updatedUndoStack,
        redoStack: [], // Clear the redo stack when an action is added to the undo stack
      }
    }
    case UserInterfaceActionTypes.POP_FROM_STACK: {
      // Popped actions move to the opposite stack
      const stackToUpdate = action.stack === "undo" ? "undoStack" : "redoStack"
      const oppositeStack = action.stack === "undo" ? "redoStack" : "undoStack"

      // Just remove the action from the stack
      // The actual popped action is executed in the pop action, not this reducer
      const updatedStack = [...(state[stackToUpdate] as ActionStack)]
      updatedStack.pop()

      const updatedOppositeStack = [...(state[oppositeStack] as ActionStack)]
      updatedOppositeStack.push(action.oppositeStackActions)

      return {
        ...state,
        [stackToUpdate]: updatedStack,
        [oppositeStack]: updatedOppositeStack,
      }
    }

    default:
      return state
  }
}
