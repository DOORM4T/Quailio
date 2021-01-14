import { Reducer } from "redux"
import {
  INetwork,
  INetworksState,
  IPerson,
  IRelationships,
  NetworkActionTypes,
  NetworksActions,
} from "./networkTypes"

const initialState: INetworksState = {
  currentNetwork: null,
  networks: [],
  isLoading: false,
}

export const networksReducer: Reducer<INetworksState, NetworksActions> = (
  state = initialState,
  action,
): INetworksState => {
  switch (action.type) {
    // SET LOADING TO true
    case NetworkActionTypes.LOADING: {
      return { ...state, isLoading: true }
    }

    // CREATE A NETWORK
    case NetworkActionTypes.CREATE: {
      return {
        ...state,
        networks: action.updatedNetworks,
        currentNetwork: action.newNetwork,
        isLoading: false,
      }
    }

    // SET THE CURRENT NETWORK
    case NetworkActionTypes.SET: {
      return {
        ...state,
        currentNetwork: action.network,
        isLoading: false,
      }
    }

    // GET ALL NETWORKS
    case NetworkActionTypes.GET_ALL: {
      return { ...state, networks: action.networks, isLoading: false }
    }

    // DELETE A NETWORK
    case NetworkActionTypes.DELETE: {
      /* delete a network */
      return {
        ...state,
        networks: action.updatedNetworks,
        currentNetwork: null,
        isLoading: false,
      }
    }

    // ADD A PERSON TO THE CURRENT NETWORK
    case NetworkActionTypes.ADD_PERSON: {
      if (!state.currentNetwork) break

      return {
        ...state,
        currentNetwork: action.updatedNetwork,
        networks: action.updatedNetworks,
        isLoading: false,
      }
    }

    // CONNECT TWO PEOPLE IN THE CURRENT NETWORK
    case NetworkActionTypes.CONNECT_PEOPLE: {
      if (!state.currentNetwork) break

      return {
        ...state,
        currentNetwork: action.updatedNetwork,
        networks: action.updatedNetworks,
        isLoading: false,
      }
    }

    // DELETE A PERSON FROM A NETWORK
    case NetworkActionTypes.DELETE_PERSON: {
      if (!state.currentNetwork) break

      return {
        ...state,
        currentNetwork: action.updatedNetwork,
        networks: action.updatedNetworks,
        isLoading: false,
      }
    }
  }
  return state
}
