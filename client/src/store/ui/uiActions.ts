import { ActionCreator } from "redux"
import { IPerson } from "../networks/networkTypes"
import {
  IFocusOnPersonAction,
  ITogglePersonEditMenu,
  UserInterfaceActionTypes,
} from "./uiTypes"

// -== ACTION CREATORS ==- //
export const setPersonInFocus: ActionCreator<IFocusOnPersonAction> = (
  person: IPerson | null,
) => ({
  type: UserInterfaceActionTypes.FOCUS_ON_PERSON,
  person,
})

export const togglePersonEditMenu: ActionCreator<ITogglePersonEditMenu> = (
  isOpen: boolean,
) => ({
  type: UserInterfaceActionTypes.TOGGLE_PERSON_EDIT_MENU,
  isOpen,
})
