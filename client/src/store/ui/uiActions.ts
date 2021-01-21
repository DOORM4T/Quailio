import { ActionCreator } from "redux"
import {
  IFocusOnPersonAction,
  ITogglePersonEditMenu,
  UserInterfaceActionTypes,
} from "./uiTypes"

// -== ACTION CREATORS ==- //
export const setPersonInFocus: ActionCreator<IFocusOnPersonAction> = (
  id: string | null,
) => ({
  type: UserInterfaceActionTypes.FOCUS_ON_PERSON,
  id,
})

export const togglePersonEditMenu: ActionCreator<ITogglePersonEditMenu> = (
  isOpen: boolean,
) => ({
  type: UserInterfaceActionTypes.TOGGLE_PERSON_EDIT_MENU,
  isOpen,
})
