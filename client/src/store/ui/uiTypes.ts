// -== STATE TYPES ==- //
export interface IUserInterfaceState {
  readonly personInFocus: string | null
  readonly isPersonEditMenuOpen: boolean
}

// -== ACTION TYPES ==- //
export enum UserInterfaceActionTypes {
  FOCUS_ON_PERSON = "UI/FOCUS_ON_PERSON",
  TOGGLE_PERSON_EDIT_MENU = "NETWORK/TOGGLE_PERSON_EDIT_MENU",
}

export interface IFocusOnPersonAction {
  type: UserInterfaceActionTypes.FOCUS_ON_PERSON
  id: string | null
}

export interface ITogglePersonEditMenu {
  type: UserInterfaceActionTypes.TOGGLE_PERSON_EDIT_MENU
  isOpen: boolean
}

/* action types used by the networks reducer */
export type UserInterfaceActions = IFocusOnPersonAction | ITogglePersonEditMenu
