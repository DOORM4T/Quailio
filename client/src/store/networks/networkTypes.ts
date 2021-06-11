import { XYVals } from "../../components/containers/ForceGraphCanvas/networkGraphTypes"
import { GroupColorField } from "./actions/setNodeColor"

// -== STATE TYPES ==- //
export interface INetworksState {
  readonly isLoading: boolean
  readonly networks: INetwork[] // Networks belonging to the current user
  readonly currentNetwork: ICurrentNetwork | null // State of the currently selected network
}

/* 
  Network type with basic id, name, and a list of person IDs.
  personIds are used to access relational person data 
*/
export interface INetwork {
  id: string
  name: string
  personIds: string[] // IDs of people in the network
  sharedProperties?: ISharedNetworkProperties // Properties used when this network is shared to the public/to certain users
}

/* 
  A network focused on by the user includes all the related people data (not just their IDs!) 
  This is used to avoid storing every person from every network in global state at the same time. That would be costly!
*/
export interface ICurrentNetwork extends INetwork {
  people: IPerson[] // People in the current network
}

export interface IPerson {
  id: string
  name: string
  relationships: IRelationships
  thumbnailUrl?: string
  content?: string
  pinXY?: XYVals
  scaleXY?: XYVals
  isBackground?: boolean

  isGroup?: boolean
  backgroundColor?: string
  textColor?: string
}

// A person's Relationships object maps a relationship to another person by their ID
export type IRelationships = { [otherPersonId: string]: IRelationship }
export interface IRelationship {
  reason: string // How two people in a relationship are related
  shape?: ConnectionShape
}

// Shape that appears on the related person's node
export type ConnectionShape = "arrow" | "none"

// -== ACTION TYPES ==- //
export enum NetworkActionTypes {
  LOADING = "NETWORK/LOADING",
  CREATE = "NETWORK/CREATE",
  SET = "NETWORK/SET_NETWORK",
  GET_ALL = "NETWORK/GET_ALL",
  DELETE = "NETWORK/DELETE",
  RESET_CLIENT = "NETWORK/RESET_CLIENT",
  ADD_PERSON = "NETWORK/ADD_PERSON",
  CONNECT_PEOPLE = "NETWORK/CONNECT_PEOPLE",
  DELETE_PERSON = "NETWORK/DELETE_PERSON",
  GET_ALL_PEOPLE = "NETWORK/GET_ALL_PEOPLE",
  SET_PERSON_THUMBNAIL = "NETWORK/SET_PERSON_THUMBNAIL",
  DISCONNECT_PEOPLE = "NETWORK/DISCONNECT_PEOPLE",
  UPDATE_PERSON_RELATIONSHIP = "NETWORK/UPDATE_PERSON_RELATIONSHIP",
  UPDATE_PERSON_NAME = "NETWORK/UPDATE_PERSON_NAME",

  UPDATE_PERSON_CONTENT = "NETWORK/UPDATE_PERSON_CONTENT",
  IMPORT_NETWORK = "NETWORK/IMPORT_NETWORK",
  RENAME_NETWORK = "NETWORK/RENAME_NETWORK",

  SET_IS_GROUP = "NETWORK/SET_IS_GROUP",
  SET_NODE_COLOR = "NETWORK/SET_NODE_COLOR",

  SHARE_NETWORK = "NETWORK/SHARE",
  UNSHARE_NETWORK = "NETWORK/UNSHARE",

  SET_NODE_PIN = "NETWORK/SET_NODE_PIN",

  SET_RELATIONSHIP_SHAPE = "NETWORK/SET_RELATIONSHIP_SHAPE",
  SET_PERSON_NODE_SCALE = "NETWORK/SET_PERSON_NODE_SCALE",
  SET_PERSON_AS_BACKGROUND_NODE = "NETWORK/SET_PERSON_AS_BACKGROUND_NODE",

  DUPLICATE_NODES = "NETWORK/DUPLICATE_NODES",
}

export interface INetworkLoadingAction {
  type: NetworkActionTypes.LOADING
  isLoading: boolean
}

export interface ICreateNetworkAction {
  type: NetworkActionTypes.CREATE
  newNetwork: INetwork
}

export interface ISetNetworkAction {
  type: NetworkActionTypes.SET
  currentNetwork: ICurrentNetwork
}

export interface IGetAllNetworksIdsAction {
  type: NetworkActionTypes.GET_ALL
  networks: INetwork[]
}

export interface IDeleteNetworkByIdAction {
  type: NetworkActionTypes.DELETE
  networkId: string // ID of the deleted network
}

export interface IResetClientNetworksAction {
  type: NetworkActionTypes.RESET_CLIENT
}

export interface IAddPersonAction {
  type: NetworkActionTypes.ADD_PERSON
  personData: IPerson
}

export interface IConnectPeopleAction {
  type: NetworkActionTypes.CONNECT_PEOPLE
  updatedP1Data: IPerson
  updatedP2Data: IPerson
}

export interface IDeletePersonByIdAction {
  type: NetworkActionTypes.DELETE_PERSON
  networkId: string // ID of the network to delete the person from
  personId: string // ID of the deleted person
}

export interface ISetPersonThumbnailAction {
  type: NetworkActionTypes.SET_PERSON_THUMBNAIL
  personId: string
  thumbnailUrl: string
}

export interface IDisconnectPeopleAction {
  type: NetworkActionTypes.DISCONNECT_PEOPLE
  updatedP1Data: IPerson
  updatedP2Data: IPerson
}

export interface IUpdateRelationshipReasonAction {
  type: NetworkActionTypes.UPDATE_PERSON_RELATIONSHIP
  p1Id: string
  p2Id: string
  newReason: string // Updated relationship reason -- what the other person means to the selected person
}

export interface IUpdatePersonNameAction {
  type: NetworkActionTypes.UPDATE_PERSON_NAME
  personId: string
  updatedName: string
}

export interface IUpdatePersonContentAction {
  type: NetworkActionTypes.UPDATE_PERSON_CONTENT
  personId: string
  content: string
}

export interface IImportNetworkAction {
  type: NetworkActionTypes.IMPORT_NETWORK
  asCurrentNetwork: ICurrentNetwork
}

export interface IRenameNetworkAction {
  type: NetworkActionTypes.RENAME_NETWORK
  networkId: string
  newName: string
}

export interface ISetIsGroupAction {
  type: NetworkActionTypes.SET_IS_GROUP
  networkId: string
  personId: string
  isGroup: boolean
}

export interface ISetNodeColor {
  type: NetworkActionTypes.SET_NODE_COLOR
  networkId: string
  personId: string
  field: GroupColorField
  newColor: string
}

export interface IAllowListUser {
  email: string
  canEdit: boolean
}
export interface ISharedNetworkProperties {
  sharedId: string | null // A null sharedId means that the network is not shared
  allowList: IAllowListUser[]
}
export interface IShareNetworkAction {
  type: NetworkActionTypes.SHARE_NETWORK
  networkId: string
  sharedProperties: ISharedNetworkProperties
}

export interface IUnshareNetworkAction {
  type: NetworkActionTypes.UNSHARE_NETWORK
  networkId: string
}

export interface ISetNodePinAction {
  type: NetworkActionTypes.SET_NODE_PIN
  networkId: string
  nodeId: string
  pinXY?: XYVals
}

export interface ISetRelationshipShape {
  type: NetworkActionTypes.SET_RELATIONSHIP_SHAPE
  networkId: string
  personId: string
  relationshipId: string
  shape: ConnectionShape
}

export interface ISetNodeScaleAction {
  type: NetworkActionTypes.SET_PERSON_NODE_SCALE
  networkId: string
  personId: string
  scaleXY?: XYVals
}

export interface ISetPersonAsBackgroundNodeAction {
  type: NetworkActionTypes.SET_PERSON_AS_BACKGROUND_NODE
  networkId: string
  personId: string
  isBackground: boolean
}

export interface IDuplicateNodesAction {
  type: NetworkActionTypes.DUPLICATE_NODES
  networkId: string
  nodeCopies: IPerson[]
}

/* Action types used by the networks reducer */
export type NetworksActions =
  | INetworkLoadingAction
  | ICreateNetworkAction
  | ISetNetworkAction
  | IGetAllNetworksIdsAction
  | IDeleteNetworkByIdAction
  | IResetClientNetworksAction
  | IAddPersonAction
  | IConnectPeopleAction
  | IDeletePersonByIdAction
  | ISetPersonThumbnailAction
  | IDisconnectPeopleAction
  | IUpdateRelationshipReasonAction
  | IUpdatePersonNameAction
  | IUpdatePersonContentAction
  | IImportNetworkAction
  | IRenameNetworkAction
  | ISetIsGroupAction
  | ISetNodeColor
  | IShareNetworkAction
  | IUnshareNetworkAction
  | ISetNodePinAction
  | ISetRelationshipShape
  | ISetNodeScaleAction
  | ISetPersonAsBackgroundNodeAction
  | IDuplicateNodesAction
