import { IPerson } from "../networks/networkTypes"

// -== STATE TYPES ==- //
export interface IUserInterfaceState {
  readonly isLoading: boolean
  readonly isPersonEditMenuOpen: boolean
  readonly personInFocus: IPersonWithContent | null
  readonly personContent: string
}

export interface IPersonWithContent extends IPerson {
  content?: string
}

// -== ACTION TYPES ==- //
export enum UserInterfaceActionTypes {
  LOADING = "UI/LOADING",
  FOCUS_ON_PERSON = "UI/FOCUS_ON_PERSON",
  SET_PERSON_CONTENT = "UI/SET_PERSON_CONTENT",
  TOGGLE_PERSON_EDIT_MENU = "UI/TOGGLE_PERSON_EDIT_MENU",
}

export interface ISetUILoadingAction {
  type: UserInterfaceActionTypes.LOADING
  isLoading: boolean
}

export interface IFocusOnPersonAction {
  type: UserInterfaceActionTypes.FOCUS_ON_PERSON
  person: IPersonWithContent | null
  personContent: string
}

export interface ITogglePersonEditMenu {
  type: UserInterfaceActionTypes.TOGGLE_PERSON_EDIT_MENU
  isOpen: boolean
}

export interface ISetPersonContentAction {
  type: UserInterfaceActionTypes.SET_PERSON_CONTENT
  personId: string
  content: string
}

/* action types used by the networks reducer */
export type UserInterfaceActions =
  | ISetUILoadingAction
  | IFocusOnPersonAction
  | ITogglePersonEditMenu
  | ISetPersonContentAction
