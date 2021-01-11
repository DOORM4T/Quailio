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
        networks: state.networks.concat(action.network),
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
      const updatedNetworks = state.networks.filter((n) => n.id !== action.id)
      return {
        ...state,
        networks: updatedNetworks,
        isLoading: false,
      }
    }

    // ADD A PERSON TO THE CURRENT NETWORK
    case NetworkActionTypes.ADD_PERSON: {
      if (!state.currentNetwork) break

      /* create an updated copy of the current network */
      const newPeople: IPerson[] = state.currentNetwork.people.concat(
        action.person,
      )
      const updatedNetwork: INetwork = {
        ...state.currentNetwork,
        people: newPeople,
      }

      /* create an updated list of all networks */
      const networks = state.networks.filter(
        (n) => n.id !== state.currentNetwork!.id,
      )
      const updatedNetworks = [updatedNetwork, ...networks]

      return {
        ...state,
        currentNetwork: updatedNetwork,
        networks: updatedNetworks,
        isLoading: false,
      }
    }

    // CONNECT TWO PEOPLE IN THE CURRENT NETWORK
    case NetworkActionTypes.CONNECT_PEOPLE: {
      if (!state.currentNetwork) break

      /* connect each person */
      const { person1, person2, p1Rel, p2Rel } = action

      const updatedPerson1Rels: IRelationships = {
        ...person1.relationships,
        [person2.name]: [p1Rel, p2Rel],
      }
      const updatedPerson1: IPerson = {
        ...person1,
        relationships: updatedPerson1Rels,
      }

      const updatedPerson2Rels: IRelationships = {
        ...person2.relationships,
        [person1.name]: [p2Rel, p1Rel],
      }
      const updatedPerson2: IPerson = {
        ...person2,
        relationships: updatedPerson2Rels,
      }

      /* create updated copy of the network with the newly connected people */
      const updatedNetwork: INetwork = {
        ...state.currentNetwork,
        people: [
          updatedPerson1,
          updatedPerson2,
          ...state.currentNetwork.people.filter(
            (p) =>
              p.name !== updatedPerson1.name && p.name !== updatedPerson2.name,
          ),
        ],
      }

      console.log(updatedNetwork)

      /* updated copy of all networks */
      const networks = state.networks.filter(
        (n) => n.id !== state.currentNetwork!.id,
      )
      const updatedNetworks: INetwork[] = [updatedNetwork, ...networks]

      return {
        ...state,
        currentNetwork: updatedNetwork,
        networks: updatedNetworks,
        isLoading: false,
      }
    }

    // DELETE A PERSON FROM A NETWORK
    case NetworkActionTypes.DELETE_PERSON: {
      if (!state.currentNetwork) break

      /* remove the person by their name */
      const peopleWithoutPerson: IPerson[] = state.currentNetwork.people.filter(
        (p) => p.name !== action.name,
      )

      /* updated copy of the current network */
      const updatedNetwork: INetwork = {
        ...state.currentNetwork,
        people: peopleWithoutPerson,
      }

      /* updated copy of all networks */
      const networks = state.networks.filter(
        (n) => n.id !== state.currentNetwork!.id,
      )
      const updatedNetworks: INetwork[] = [updatedNetwork, ...networks]

      return {
        ...state,
        currentNetwork: updatedNetwork,
        networks: updatedNetworks,
      }
    }
  }
  return state
}
