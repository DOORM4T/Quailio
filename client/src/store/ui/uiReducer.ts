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
  filteredGroups: {},
  activeGroupsByPersonId: {},
  doShowNodesWithoutGroups: true,

  isShareMenuOpen: false,

  isViewingShared: false,
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

    // State for filtering shown groups
    case UserInterfaceActionTypes.TOGGLE_GROUP_FILTER: {
      const filteredGroupsCopy = { ...state.filteredGroups }
      filteredGroupsCopy[action.groupId] = action.doShow

      return {
        ...state,
        filteredGroups: filteredGroupsCopy,
      }
    }

    // State for determining whether to show nodes without groups or not
    case UserInterfaceActionTypes.TOGGLE_SHOW_NODES_WITHOUT_GROUPS: {
      return {
        ...state,
        doShowNodesWithoutGroups: action.doShow,
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

    default:
      return state
  }
}
