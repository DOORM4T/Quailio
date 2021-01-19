import { ActionCreator, AnyAction, Dispatch } from "redux"
import { ThunkAction } from "redux-thunk"
import { v4 as uuidv4 } from "uuid"
import { db } from "../../firebase"
import { store } from "../store"
import {
  IAddPersonAction,
  IConnectPeopleAction,
  ICreateNetworkAction,
  IDeleteNetworkByIdAction,
  IDeletePersonByIdAction,
  IFirebaseData,
  IGetAllNetworksAction,
  INetwork,
  INetworkLoadingAction,
  INetworksState,
  IPerson,
  IResetClientNetworksAction,
  ISetNetworkAction,
  NetworkActionTypes,
} from "./networkTypes"

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
      id: uuidv4(),
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

      const updatedNetwork: INetwork = {
        ...prevNetwork,
        people: [person, ...prevNetwork.people],
      }

      /* create updated networks array without the previous version of the updated network */
      const updatedNetworks: INetwork[] = [
        ...prevNetworks.filter((n) => n.id !== networkId),
        updatedNetwork,
      ]

      /* updated version of the entire document in Firebase */
      const updatedData = {
        ...data,
        networks: updatedNetworks,
      }
      await collection.doc(uid).set(updatedData)

      return dispatch({
        type: NetworkActionTypes.ADD_PERSON,
        updatedNetwork,
        updatedNetworks,
      })
    } catch (error) {
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

export const connectPeople: ActionCreator<
  ThunkAction<Promise<AnyAction>, INetworksState, null, IConnectPeopleAction>
> = (
  networkId: string,
  p1Id: string,
  p2Id: string,
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

      /* get each person by their ID */
      const person1 = prevNetwork.people.find((p) => p.id === p1Id)
      const person2 = prevNetwork.people.find((p) => p.id === p2Id)

      if (!person1 || !person2) throw new Error("person(s) not found")

      /* set the relationship */
      person1.relationships[p2Id] = [p1Rel, p2Rel]
      person2.relationships[p1Id] = [p2Rel, p1Rel]

      /* update current network with updated people */
      const updatedNetwork: INetwork = {
        ...prevNetwork,
        people: [
          person1,
          person2,
          ...prevNetwork.people.filter((p) => p.id !== p1Id && p.id !== p2Id),
        ],
      }

      /* create updated networks array without the previous version of the updated network */
      const updatedNetworks: INetwork[] = [
        ...prevNetworks.filter((n) => n.id !== networkId),
        updatedNetwork,
      ]

      const updatedData = {
        ...data,
        networks: updatedNetworks,
      }

      await collection.doc(uid).set(updatedData)

      return dispatch({
        type: NetworkActionTypes.CONNECT_PEOPLE,
        updatedNetwork,
        updatedNetworks,
      })
    } catch (error) {
      dispatch(setNetworkLoading(false))
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
    const newNetwork: INetwork = {
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
      const updatedNetworks: INetwork[] = [...prevNetworks, newNetwork]

      const updatedData = {
        ...data,
        networks: updatedNetworks,
      }

      await collection.doc(uid).set(updatedData)

      return dispatch({
        type: NetworkActionTypes.CREATE,
        newNetwork,
        updatedNetworks,
      })
    } catch (error) {
      dispatch(setNetworkLoading(false))
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

      /* get all networks from Firebase */
      const data = (await collection.doc(uid).get()).data() as IFirebaseData
      if (!data) throw new Error("no networks found")

      /* find the selected network */
      const networks: INetwork[] = data.networks
      const network = networks.find((n) => n.id === id)

      return dispatch({
        type: NetworkActionTypes.SET,
        network,
      })
    } catch (error) {
      dispatch(setNetworkLoading(false))
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

    try {
      /* get user id */
      const uid = store.getState().auth.userId
      if (!uid) throw new Error("user not found")

      /* get all networks from Firebase */
      const data = (await collection.doc(uid).get()).data() as IFirebaseData
      if (!data) throw new Error("no networks found")

      /* filter out the network */
      const networks: INetwork[] = data.networks
      const updatedNetworks = networks.filter((n) => n.id !== id)

      /* update Firebase document */
      const updatedData = {
        ...data,
        networks: updatedNetworks,
      }
      await collection.doc(uid).set(updatedData)

      return dispatch({
        type: NetworkActionTypes.DELETE,
        updatedNetworks,
      })
    } catch (error) {
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

export const deletePerson: ActionCreator<
  ThunkAction<Promise<AnyAction>, INetworksState, null, IDeletePersonByIdAction>
> = (networkId: string, personId: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      /* get user id */
      const uid = store.getState().auth.userId
      if (!uid) throw new Error("user not found")

      /* get all networks from Firebase */
      const data = (await collection.doc(uid).get()).data() as IFirebaseData
      if (!data) throw new Error("no networks found")

      /* get the current network */
      const networks: INetwork[] = data.networks
      const currentNetwork = networks.find((n) => n.id === networkId)
      if (!currentNetwork) throw new Error("current network not found")

      /* remove the person and all relationships other people had with them */
      const updatedPeople: IPerson[] = currentNetwork.people
        .filter((p) => p.id !== personId)
        .map((p) => {
          delete p.relationships[personId]
          return p
        })

      /* update the network */
      const updatedNetwork: INetwork = {
        ...currentNetwork,
        people: updatedPeople,
      }

      /* update all networks */
      const withoutUpdatedNetwork: INetwork[] = [
        ...networks.filter((n) => n.id !== networkId),
      ]
      const updatedNetworks: INetwork[] = [
        updatedNetwork,
        ...withoutUpdatedNetwork,
      ]

      /* update Firebase document */
      const updatedData = {
        ...data,
        networks: updatedNetworks,
      }
      await collection.doc(uid).set(updatedData)

      return dispatch({
        type: NetworkActionTypes.DELETE_PERSON,
        updatedNetwork,
        updatedNetworks,
      })
    } catch (error) {
      dispatch(setNetworkLoading(false))
      throw error
    }
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
      if (!data) throw new Error("no networks found")

      const networks: INetwork[] = data.networks

      return dispatch({
        type: NetworkActionTypes.GET_ALL,
        networks,
      })
    } catch (error) {
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

// Reset local network state. Called when the logout/delete account actions are successful.
export const resetLocalNetworks: ActionCreator<IResetClientNetworksAction> = () => ({
  type: NetworkActionTypes.RESET_CLIENT,
})
