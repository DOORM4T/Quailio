import { INetworkJSON } from "../../helpers/getNetworkJSON"

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
}

/* string 1: this person in relation to the other person 
   string 2: other person in relation to this person */
export type IRelationships = { [otherPersonId: string]: [string, string] }

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
  p2MeaningToP1: string // Updated relationship reason -- what the other person means to the selected person
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
