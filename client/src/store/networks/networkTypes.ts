// -== STATE TYPES ==- //
export interface INetworksState {
  readonly isLoading: boolean
  readonly networks: INetwork[] // Networks belonging to the current user
  readonly currentNetwork: ICurrentNetwork | null // State of the currently selected network
}

export interface INetwork {
  id: string
  name: string
  personIds: string[] // IDs of people in the network
}

export interface ICurrentNetwork extends INetwork {
  people: IPerson[] // People in the current network
}

export interface IPerson {
  id: string
  name: string
  relationships: IRelationships
  thumbnailUrl?: string
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
  personId: string // ID of the added person
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

export interface IGetAllPeopleAction {
  type: NetworkActionTypes.GET_ALL_PEOPLE
  people: IPerson[]
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

/* action types used by the networks reducer */
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
  | IGetAllPeopleAction
  | ISetPersonThumbnailAction
  | IDisconnectPeopleAction
