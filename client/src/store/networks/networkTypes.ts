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
  content?: string // User-generated rich text
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
}

export interface IConnectPeopleAction {
  type: NetworkActionTypes.CONNECT_PEOPLE
  /* No payload -- The current network refers to the IDs of these newly connected people. 
     There is a separate action to get each person's document by their ID */
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
