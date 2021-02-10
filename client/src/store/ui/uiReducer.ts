import { Reducer } from "redux"
import {
  IUserInterfaceState,
  UserInterfaceActions,
  UserInterfaceActionTypes,
} from "./uiTypes"

const initialState: IUserInterfaceState = {
  isLoading: false,
  isPersonEditMenuOpen: false,
  personInFocus: null,
  personContent: "",
}

export const uiReducer: Reducer<IUserInterfaceState, UserInterfaceActions> = (
  state = initialState,
  action,
): IUserInterfaceState => {
  switch (action.type) {
    case UserInterfaceActionTypes.LOADING: {
      return { ...state, isLoading: action.isLoading }
    }

    case UserInterfaceActionTypes.FOCUS_ON_PERSON: {
      return {
        ...state,
        personInFocus: action.person,
        personContent: action.personContent,
        isLoading: false,
      }
    }

    /* SET A PERSON'S RICH TEXT CONTENT */
    case UserInterfaceActionTypes.SET_PERSON_CONTENT: {
      /* Stop if there's no person selected */
      if (!state.personInFocus) break

      return {
        ...state,
        personContent: action.content,
        isLoading: false,
      }
    }

    case UserInterfaceActionTypes.TOGGLE_PERSON_EDIT_MENU: {
      return {
        ...state,
        isPersonEditMenuOpen: action.isOpen,
      }
    }
  }
  return state
}
