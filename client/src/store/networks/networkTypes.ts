// -== STATE TYPES ==- //
export interface INetworksState {
  readonly currentNetwork: INetwork | null
  readonly networks: INetwork[]
  readonly isLoading: boolean
}

export interface INetwork {
  id: string
  name: string
  people: IPerson[]
}

export interface IPerson {
  name: string
  relationships: IRelationships
  thumbnail_url?: string
  properties?: IPersonProperties
}

export interface IPersonProperties {
  name: string
  birthday: Date | string
  hometown: string
  last_update: Date | string
  [customProperty: string]: any
}

/* string 1: this person in relation to the other person 
   string 2: other person in relation to this person */
export type IRelationships = { [otherPersonName: string]: [string, string] }

// -== ACTION TYPES ==- //
export enum NetworkActionTypes {
  LOADING = "NETWORK/LOADING",
  CREATE = "NETWORK/CREATE",
  SET = "NETWORK/SET_NETWORK",
  GET_ALL = "NETWORK/GET_ALL",
  DELETE = "NETWORK/DELETE",
  ADD_PERSON = "NETWORK/ADD_PERSON",
  CONNECT_PEOPLE = "NETWORK/CONNECT_PEOPLE",
  DELETE_PERSON = "NETWORK/DELETE_PERSON",
}

export interface INetworkLoadingAction {
  type: NetworkActionTypes.LOADING
  isLoading: boolean
}

export interface ICreateNetworkAction {
  type: NetworkActionTypes.CREATE
  network: INetwork
}

export interface ISetNetworkAction {
  type: NetworkActionTypes.SET
  network: INetwork
}

export interface IGetAllNetworksAction {
  type: NetworkActionTypes.GET_ALL
  networks: INetwork[]
}

export interface IDeleteNetworkByIdAction {
  type: NetworkActionTypes.DELETE
  updatedNetworks: INetwork[]
}

export interface IAddPersonAction {
  type: NetworkActionTypes.ADD_PERSON
  updatedNetwork: INetwork
  updatedNetworks: INetwork[]
}

export interface IConnectPeopleAction {
  type: NetworkActionTypes.CONNECT_PEOPLE
  updatedNetwork: INetwork
  updatedNetworks: INetwork[]
}

export interface IDeletePersonByNameAction {
  type: NetworkActionTypes.DELETE_PERSON
  name: string
}

/* action types used by the networks reducer */
export type NetworksActions =
  | INetworkLoadingAction
  | ICreateNetworkAction
  | ISetNetworkAction
  | IGetAllNetworksAction
  | IDeleteNetworkByIdAction
  | IAddPersonAction
  | IConnectPeopleAction
  | IDeletePersonByNameAction

/* document type for data stored in Firebase */
export interface IFirebaseData {
  networks: INetwork[]
}
