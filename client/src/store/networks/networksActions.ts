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
  IFirebaseData,
} from "./networkTypes"

import { store } from "../store"
import { db } from "../../firebase"
const collection = db.collection("networks")

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
> = (networkId: string, name: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setNetworkLoading(true))

    const person: IPerson = {
      name,
      relationships: {},
    }

    /* update with Firebase */
    try {
      const uid = store.getState().auth.userId
      if (!uid) throw new Error("user not found")

      let data = (await collection.doc(uid).get()).data() as IFirebaseData
      if (!data) {
        /* create a collection for the user if they don't already have one */
        await collection.doc(uid).set({ networks: [] })
        data = (await collection.doc(uid).get()).data() as IFirebaseData
      }

      const prevNetworks: INetwork[] = (data as IFirebaseData).networks

      const prevNetwork = prevNetworks.find((n) => n.id === networkId)
      if (!prevNetwork) throw new Error("network not found")

      const newNetwork: INetwork = {
        ...prevNetwork,
        people: [...prevNetwork.people, person],
      }

      /* create updated networks array without the previous version of the updated network */
      const newNetworks: INetwork[] = [
        ...prevNetworks.filter((n) => n.id !== networkId),
        newNetwork,
      ]

      const updatedData = {
        ...data,
        networks: newNetworks,
      }

      await collection.doc(uid).set(updatedData)

      return dispatch({
        type: NetworkActionTypes.ADD_PERSON,
        newNetwork,
        person,
      })
    } catch (error) {
      throw error
    }
  }
}

export const connectPeople: ActionCreator<
  ThunkAction<Promise<AnyAction>, INetworksState, null, IConnectPeopleAction>
> = (
  networkId: string,
  p1Name: string,
  p2Name: string,
  p1Rel: string = "",
  p2Rel: string = "",
) => {
  return async (dispatch: Dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      const uid = store.getState().auth.userId
      if (!uid) throw new Error("user not found")

      const data = (await collection.doc(uid).get()).data() as IFirebaseData
      const prevNetworks: INetwork[] = (data as IFirebaseData).networks
      const prevNetwork = prevNetworks.find((n) => n.id === networkId)
      if (!prevNetwork) throw new Error("network not found")

      const person1 = prevNetwork.people.find((p) => p.name === p1Name)
      const person2 = prevNetwork.people.find((p) => p.name === p2Name)

      if (!person1 || !person2) throw new Error("person(s) not found")

      /* set the relationship */
      person1.relationships[p2Name] = [p1Rel, p2Rel]
      person2.relationships[p1Name] = [p2Rel, p1Rel]

      /* update current network with updated people */
      const updatedNetwork: INetwork = {
        ...prevNetwork,
        people: [
          person1,
          person2,
          ...prevNetwork.people.filter(
            (p) => p.name !== p1Name && p.name !== p2Name,
          ),
        ],
      }

      /* create updated networks array without the previous version of the updated network */
      const newNetworks: INetwork[] = [
        ...prevNetworks.filter((n) => n.id !== networkId),
        updatedNetwork,
      ]

      const updatedData = {
        ...data,
        networks: newNetworks,
      }

      await collection.doc(uid).set(updatedData)

      return dispatch({
        type: NetworkActionTypes.CONNECT_PEOPLE,
        person1,
        person2,
        p1Rel,
        p2Rel,
      })
    } catch (error) {
      throw error
    }
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

    /* update with Firebase */
    try {
      const uid = store.getState().auth.userId
      if (!uid) throw new Error("user not found")

      let data = (await collection.doc(uid).get()).data() as IFirebaseData
      if (!data) {
        /* create a collection for the user if they don't already have one */
        await collection.doc(uid).set({ networks: [] })
        data = (await collection.doc(uid).get()).data() as IFirebaseData
      }

      const prevNetworks: INetwork[] = (data as IFirebaseData).networks
      const newNetworks: INetwork[] = [...prevNetworks, network]

      const updatedData = {
        ...data,
        networks: newNetworks,
      }

      await collection.doc(uid).set(updatedData)

      return dispatch({
        type: NetworkActionTypes.CREATE,
        network,
      })
    } catch (error) {
      throw error
    }
  }
}

export const setNetwork: ActionCreator<
  ThunkAction<Promise<AnyAction>, INetworksState, null, ISetNetworkAction>
> = (id: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      const uid = store.getState().auth.userId
      if (!uid) throw new Error("user not found")

      // TODO: Get all networks from Firebase
      const data = (await collection.doc(uid).get()).data() as IFirebaseData
      if (!data) throw new Error("data not found")

      const networks: INetwork[] = data.networks
      const network = networks.find((n) => n.id === id)

      return dispatch({
        type: NetworkActionTypes.SET,
        network,
      })
    } catch (error) {
      throw error
    }
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

    try {
      const uid = store.getState().auth.userId
      if (!uid) throw new Error("user not found")

      const data = (await collection.doc(uid).get()).data() as IFirebaseData
      if (!data) throw new Error("data not found")

      const networks: INetwork[] = data.networks

      return dispatch({
        type: NetworkActionTypes.GET_ALL,
        networks,
      })
    } catch (error) {
      throw error
    }
  }
}

export async function wait(ms: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(null)
    }, ms)
  })
}
