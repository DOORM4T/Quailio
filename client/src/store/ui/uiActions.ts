import { ActionCreator } from "redux"
import { IPerson } from "../networks/networkTypes"
import { store } from "../store"
import {
  IFocusOnPersonAction,
  ITogglePersonEditMenu,
  UserInterfaceActionTypes,
} from "./uiTypes"

// -== ACTION CREATORS ==- //
export const setPersonInFocus: ActionCreator<IFocusOnPersonAction> = (
  personId: string | null,
) => {
  const currentNetwork = store.getState().networks.currentNetwork

  const person: IPerson | null = currentNetwork
    ? currentNetwork.people.find((p) => p.id === personId) ?? null // If person not found, return null instead of undefined
    : null

  return { type: UserInterfaceActionTypes.FOCUS_ON_PERSON, person }
}

export const togglePersonEditMenu: ActionCreator<ITogglePersonEditMenu> = (
  isOpen: boolean,
) => ({
  type: UserInterfaceActionTypes.TOGGLE_PERSON_EDIT_MENU,
  isOpen,
})
