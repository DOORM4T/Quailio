import { Reducer } from "redux"
import {
  IUserInterfaceState,
  UserInterfaceActions,
  UserInterfaceActionTypes,
} from "./uiTypes"

const initialState: IUserInterfaceState = {
  personInFocus: null,
  isPersonEditMenuOpen: false,
}

export const uiReducer: Reducer<IUserInterfaceState, UserInterfaceActions> = (
  state = initialState,
  action,
): IUserInterfaceState => {
  switch (action.type) {
    // SET LOADING TO true
    case UserInterfaceActionTypes.FOCUS_ON_PERSON: {
      return { ...state, personInFocus: action.id }
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
