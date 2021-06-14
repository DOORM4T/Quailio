import { IPerson } from "../networks/networkTypes"

// -== STATE TYPES ==- //
export interface IUserInterfaceState {
  readonly isLoading: boolean
  readonly isPersonEditMenuOpen: boolean
  readonly personInFocus: string | null
  readonly personInZoom: string | null
  readonly activeGroupsByPersonId: IActiveGroupsByPersonId // Map tracking the active/showing groups a person is part of
  readonly isShareMenuOpen: boolean // State for showing the share menu
  readonly isViewingShared: boolean // Whether the user is viewing a shared network or not
  readonly personNodeVisibility: IVisibilityMap
  readonly toolbarAction: ToolbarAction
  readonly isSmallMode: boolean
  readonly selectedNodeIds: string[]
  readonly bfsPath: IBFSDetails | null
}

export type IVisibilityMap = { [nodeId: string]: boolean } // Visible if true or undefined
export type ToolbarAction =
  | "CREATE"
  | "DELETE"
  | "LINK"
  | "MOVE"
  | "PIN"
  | "RESIZE"
  | "SELECT"
  | "TOGGLE_NAMETAG"
  | "VIEW"

export interface IActiveGroupsByPersonId {
  [personId: string]: string[]
}

export interface IBFSDetails {
  person1: IPerson
  person2: IPerson
  paths: IBFSPathItem[][]
}
export interface IBFSPathItem {
  id: string
  name: string
  description: string
}

// -== ACTION TYPES ==- //
export enum UserInterfaceActionTypes {
  LOADING = "UI/LOADING",
  FOCUS_ON_PERSON_BY_ID = "UI/FOCUS_ON_PERSON_BY_ID",
  TOGGLE_PERSON_OVERLAY = "UI/TOGGLE_PERSON_OVERLAY",
  ZOOM_TO_PERSON = "UI/ZOOM_TO_PERSON",
  INIT_PERSON_ACTIVE_GROUPS = "UI/INIT_PERSON_ACTIVE_GROUPS",
  TOGGLE_SHARE_OVERLAY = "UI/TOGGLE_SHARE_OVERLAY",
  SET_VIEWING_SHARED = "UI/SET_VIEWING_SHARED",
  SET_NODE_VISIBILITY = "UI/SET_NODE_VISIBILITY",
  RESET_UI = "UI/RESET_UI",
  SET_TOOLBAR_ACTION = "UI/SET_TOOLBAR_ACTION",
  SET_SMALL_MODE = "UI/SET_SMALL_MODE",
  SELECT_NODES = "UI/SELECT_NODES",
  SET_BFS_PATH = "UI/SET_BFS_PATH",
}

export interface ISetUILoadingAction {
  type: UserInterfaceActionTypes.LOADING
  isLoading: boolean
}

export interface IFocusOnPersonAction {
  type: UserInterfaceActionTypes.FOCUS_ON_PERSON_BY_ID
  personId: string | null
}

export interface ITogglePersonOverlay {
  type: UserInterfaceActionTypes.TOGGLE_PERSON_OVERLAY
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

export interface IToggleShareOverlayAction {
  type: UserInterfaceActionTypes.TOGGLE_SHARE_OVERLAY
  isOpen: boolean
}

export interface ISetViewingSharedAction {
  type: UserInterfaceActionTypes.SET_VIEWING_SHARED
  isViewingShared: boolean
}

export interface ISetNodeVisibilityAction {
  type: UserInterfaceActionTypes.SET_NODE_VISIBILITY
  nodeIds: string | string[]
  isVisible: boolean
}

export interface IResetUIAction {
  type: UserInterfaceActionTypes.RESET_UI
}

export interface ISetToolbarAction {
  type: UserInterfaceActionTypes.SET_TOOLBAR_ACTION
  toolbarAction: ToolbarAction
}

export interface ISetSmallModeAction {
  type: UserInterfaceActionTypes.SET_SMALL_MODE
  isSmall: boolean
}

export interface ISelectNodesAction {
  type: UserInterfaceActionTypes.SELECT_NODES
  selectedNodeIds: string[]
}
export interface ISetBFSPathAction {
  type: UserInterfaceActionTypes.SET_BFS_PATH
  paths: IBFSDetails | null
}

// action types used by the networks reducer
export type UserInterfaceActions =
  | ISetUILoadingAction
  | IFocusOnPersonAction
  | ITogglePersonOverlay
  | IZoomToPersonAction
  | IInitializePersonGroupList
  | IToggleShareOverlayAction
  | ISetViewingSharedAction
  | ISetNodeVisibilityAction
  | IResetUIAction
  | ISetToolbarAction
  | ISetSmallModeAction
  | ISelectNodesAction
  | ISetBFSPathAction
