import { Reducer } from "redux"
import {
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
      return {
        ...state,
        personNodeVisibility: {
          ...state.personNodeVisibility,
          [action.nodeId]: action.isVisible,
        },
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

    default:
      return state
  }
}
