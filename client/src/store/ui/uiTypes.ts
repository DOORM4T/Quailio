// -== STATE TYPES ==- //
export interface IUserInterfaceState {
  readonly isLoading: boolean
  readonly isPersonEditMenuOpen: boolean
  readonly personInFocus: string | null
  readonly personInZoom: string | null
  readonly activeGroupsByPersonId: IActiveGroupsByPersonId // Map tracking the active/showing groups a person is part of
  readonly filteredGroups: { [groupId: string]: boolean } // "Showing" state for each group
  readonly doShowNodesWithoutGroups: boolean
}

export interface IActiveGroupsByPersonId {
  [personId: string]: string[]
}

// -== ACTION TYPES ==- //
export enum UserInterfaceActionTypes {
  LOADING = "UI/LOADING",
  FOCUS_ON_PERSON_BY_ID = "UI/FOCUS_ON_PERSON_BY_ID",
  TOGGLE_PERSON_EDIT_MENU = "UI/TOGGLE_PERSON_EDIT_MENU",
  ZOOM_TO_PERSON = "UI/ZOOM_TO_PERSON",
  INIT_PERSON_ACTIVE_GROUPS = "UI/INIT_PERSON_ACTIVE_GROUPS",
  TOGGLE_GROUP_FILTER = "UI/TOGGLE_GROUP_FILTER",
  TOGGLE_SHOW_NODES_WITHOUT_GROUPS = "UI/TOGGLE_SHOW_NODES_WITHOUT_GROUPS",
}

export interface ISetUILoadingAction {
  type: UserInterfaceActionTypes.LOADING
  isLoading: boolean
}

export interface IFocusOnPersonAction {
  type: UserInterfaceActionTypes.FOCUS_ON_PERSON_BY_ID
  personId: string | null
}

export interface ITogglePersonEditMenuAction {
  type: UserInterfaceActionTypes.TOGGLE_PERSON_EDIT_MENU
  isOpen: boolean
}

export interface IZoomToPersonAction {
  type: UserInterfaceActionTypes.ZOOM_TO_PERSON
  personId: string | null // ID of the person to zoom-in on. null means no person is zoomed in on
}

export interface IPersonIDWithActiveGroups {
  personId: string
  activeGroupIds: string[]
}

export interface IInitializePersonGroupList {
  type: UserInterfaceActionTypes.INIT_PERSON_ACTIVE_GROUPS
  groupIdsbyPersonId: IPersonIDWithActiveGroups[] // Takes an array of objects using personIds as keys and an array of group IDs as values
}

export interface IToggleGroupFilterAction {
  type: UserInterfaceActionTypes.TOGGLE_GROUP_FILTER
  groupId: string
  doShow: boolean
}

export interface IToggleShowNodesWithoutGroupsAction {
  type: UserInterfaceActionTypes.TOGGLE_SHOW_NODES_WITHOUT_GROUPS
  doShow: boolean
}

/* action types used by the networks reducer */
export type UserInterfaceActions =
  | ISetUILoadingAction
  | IFocusOnPersonAction
  | ITogglePersonEditMenuAction
  | IZoomToPersonAction
  | IInitializePersonGroupList
  | IToggleGroupFilterAction
  | IToggleShowNodesWithoutGroupsAction
