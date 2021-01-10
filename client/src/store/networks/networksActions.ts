import { ActionCreator, AnyAction, Dispatch } from "redux"
import { ThunkAction } from "redux-thunk"

import { v4 as uuidv4 } from "uuid"

import {
  INetworksState,
  NetworkActionTypes,
  INetworkLoadingAction,
  IAddPersonAction,
  IConnectPeopleAction,
  ICreateNetworkAction,
  IDeleteNetworkByIdAction,
  IDeletePersonByNameAction,
  IGetAllNetworksAction,
  IPerson,
  INetwork,
  ISetNetworkAction,
} from "./networkTypes"

// -== ACTION CREATORS ==- //
/* set isLoading state to true for async actions. Reducer will set isLoading to false for async actions.. */
export const setNetworkLoading: ActionCreator<INetworkLoadingAction> = (
  isLoading: boolean,
) => ({
  type: NetworkActionTypes.LOADING,
  isLoading,
})

export const addPerson: ActionCreator<
  ThunkAction<Promise<AnyAction>, INetworksState, null, IAddPersonAction>
> = (network: INetwork, person: IPerson) => {
  return async (dispatch: Dispatch) => {
    dispatch(setNetworkLoading(true))

    // TODO: Interact with API
    await wait(1000)
    return dispatch({
      type: NetworkActionTypes.ADD_PERSON,
      network,
      person,
    })
  }
}

export const connectPeople: ActionCreator<
  ThunkAction<Promise<AnyAction>, INetworksState, null, IConnectPeopleAction>
> = (person1: IPerson, person2: IPerson) => {
  return async (dispatch: Dispatch) => {
    dispatch(setNetworkLoading(true))

    // TODO: Interact with API
    await wait(1000)

    return dispatch({
      type: NetworkActionTypes.CONNECT_PEOPLE,
      person1,
      person2,
    })
  }
}

export const createNetwork: ActionCreator<
  ThunkAction<Promise<AnyAction>, INetworksState, null, ICreateNetworkAction>
> = (name: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setNetworkLoading(true))

    /* create the network with a random ID & an empty list of people */
    const network: INetwork = {
      id: uuidv4(),
      name,
      people: [],
    }

    // TODO: Interact with API
    await wait(1000)

    return dispatch({
      type: NetworkActionTypes.CREATE,
      network,
    })
  }
}

export const setNetwork: ActionCreator<
  ThunkAction<Promise<AnyAction>, INetworksState, null, ISetNetworkAction>
> = (id: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setNetworkLoading(true))

    await wait(1000)
    // TODO: Get all networks from Firebase
    const networks: INetwork[] = [] // get from firebase
    const network: INetwork = networks.filter((n) => n.id === id)[0] || null

    return dispatch({
      type: NetworkActionTypes.SET,
      network,
    })
  }
}

export const deleteNetwork: ActionCreator<
  ThunkAction<
    Promise<AnyAction>,
    INetworksState,
    null,
    IDeleteNetworkByIdAction
  >
> = (id: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setNetworkLoading(true))

    // TODO: Interact with API
    await wait(1000)

    return dispatch({
      type: NetworkActionTypes.DELETE,
      id,
    })
  }
}

export const deletePerson: ActionCreator<
  ThunkAction<
    Promise<AnyAction>,
    INetworksState,
    null,
    IDeletePersonByNameAction
  >
> = (name: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setNetworkLoading(true))

    // TODO: Interact with API
    await wait(1000)

    return dispatch({
      type: NetworkActionTypes.DELETE_PERSON,
      name,
    })
  }
}

export const getAllNetworks: ActionCreator<
  ThunkAction<Promise<AnyAction>, INetworksState, null, IGetAllNetworksAction>
> = () => {
  return async (dispatch: Dispatch) => {
    dispatch(setNetworkLoading(true))

    // TODO: Get all networks from Firebase
    await wait(1000)
    // empty array if no networks found
    const networks: INetwork[] = []

    return dispatch({
      type: NetworkActionTypes.GET_ALL,
      networks,
    })
  }
}

export async function wait(ms: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(null)
    }, ms)
  })
}
