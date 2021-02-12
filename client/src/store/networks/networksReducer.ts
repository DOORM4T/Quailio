import { Reducer } from "redux"
import {
  ICurrentNetwork,
  INetworksState,
  IPerson,
  NetworkActionTypes,
  NetworksActions,
} from "./networkTypes"

const initialState: INetworksState = {
  isLoading: false,
  networks: [],
  currentNetwork: null,
}

export const networksReducer: Reducer<INetworksState, NetworksActions> = (
  state = initialState,
  action,
): INetworksState => {
  switch (action.type) {
    // SET LOADING TO true
    case NetworkActionTypes.LOADING: {
      return { ...state, isLoading: action.isLoading }
    }

    //
    // NETWORKS
    //

    // -== CREATE A NETWORK ==- //
    case NetworkActionTypes.CREATE: {
      return {
        ...state,
        networks: state.networks.concat(action.newNetwork), // add the ID to the current list of network IDs
        currentNetwork: { ...action.newNetwork, people: [] }, // set the current network to the new network
        isLoading: false,
      }
    }

    // -== SET THE CURRENT NETWORK ==- //
    case NetworkActionTypes.SET: {
      return {
        ...state,
        currentNetwork: action.currentNetwork,
        isLoading: false,
      }
    }

    // -== GET ALL NETWORKS ==- //
    case NetworkActionTypes.GET_ALL: {
      return { ...state, networks: action.networks, isLoading: false }
    }

    // -== DELETE A NETWORK ==- //
    case NetworkActionTypes.DELETE: {
      const idsWithoutDeletedNetwork = state.networks.filter(
        (network) => network.id !== action.networkId,
      )

      return {
        ...state,
        networks: idsWithoutDeletedNetwork,
        currentNetwork: null, // clear network selection
        isLoading: false,
      }
    }

    // -== RESET CLIENT STATE (should happen after logging out) ==- //
    case NetworkActionTypes.RESET_CLIENT: {
      return initialState
    }

    //
    // PEOPLE
    //

    // -== ADD A PERSON TO THE CURRENT NETWORK ==- //
    case NetworkActionTypes.ADD_PERSON: {
      /* Stop if there is no network selected */
      if (!state.currentNetwork) break

      /* Append the new person ID to the current network's list of person IDs */
      const updatedPersonIds = state.currentNetwork.personIds.concat(
        action.personId,
      )

      /* Append the new person data to the current network's list of person data */
      const updatedPeopleData = state.currentNetwork.people.concat(
        action.personData,
      )

      /* Network with the updated IDs and data */
      const updatedNetwork: ICurrentNetwork = {
        ...state.currentNetwork,
        personIds: updatedPersonIds,
        people: updatedPeopleData,
      }

      return {
        ...state,
        currentNetwork: updatedNetwork,
        isLoading: false,
      }
    }

    // -== CONNECT/DISCONNECT TWO PEOPLE IN THE CURRENT NETWORK ==- //
    case NetworkActionTypes.CONNECT_PEOPLE:
    case NetworkActionTypes.DISCONNECT_PEOPLE: {
      /* Stop if no network is selected */
      if (!state.currentNetwork) break

      /* Get the person data without the updated, newly (dis)connected people */
      const peopleWithoutUpdatedPeople: IPerson[] = [
        ...state.currentNetwork.people.filter(
          (p) =>
            p.id !== action.updatedP1Data.id &&
            p.id !== action.updatedP2Data.id,
        ),
      ]

      /* Append the updated people to the list */
      const updatedPeople = peopleWithoutUpdatedPeople
        .concat(action.updatedP1Data)
        .concat(action.updatedP2Data)

      /* Create an updated current network object */
      const updatedNetwork: ICurrentNetwork = {
        ...state.currentNetwork,
        people: updatedPeople,
      }

      return {
        ...state,
        currentNetwork: updatedNetwork,
        isLoading: false,
      }
    }

    // -== DELETE A PERSON FROM THE CURRENT NETWORK ==- //
    case NetworkActionTypes.DELETE_PERSON: {
      /* Stop if no network is selected */
      if (!state.currentNetwork) break

      /* Removed the person from the current network? Update the current network IDs list */
      const isCurrentNetwork = state.currentNetwork.id === action.networkId
      if (isCurrentNetwork) {
        /* Remove the person's ID from the current network's list of person IDs */
        const idsWithoutDeletedPerson = state.currentNetwork.personIds.filter(
          (id) => id !== action.personId,
        )

        /* Network with the updated IDs */
        const updatedNetwork = {
          ...state.currentNetwork,
          personIds: idsWithoutDeletedPerson,
        }

        return {
          ...state,
          currentNetwork: updatedNetwork,
          isLoading: false,
        }
      }

      /* Otherwise, just end the loading state */
      return {
        ...state,
        isLoading: false,
      }
    }

    // -== GET ALL PEOPLE IN THE CURRENT NETWORK ==- //
    case NetworkActionTypes.GET_ALL_PEOPLE: {
      /* Stop if there's no Network selected */
      if (!state.currentNetwork) break

      return {
        ...state,
        currentNetwork: { ...state.currentNetwork, people: action.people },
        isLoading: false,
      }
    }

    // -== UPDATE A PERSON'S THUMBNAIL URL ==- //
    case NetworkActionTypes.SET_PERSON_THUMBNAIL: {
      /* Stop if there's no Network selected */
      if (!state.currentNetwork) break

      /* Find the person whose thumbnail will be updated */
      const person = state.currentNetwork.people.find(
        (p) => p.id === action.personId,
      )
      if (!person) break

      /* Create the updated person object */
      const updatedPerson: IPerson = {
        ...person,
        thumbnailUrl: action.thumbnailUrl,
      }

      /* Create an updated people array */
      const peopleWithoutUpdatedPerson: IPerson[] = state.currentNetwork.people.filter(
        (p) => p.id !== action.personId,
      )
      const updatedPeople: IPerson[] = peopleWithoutUpdatedPerson.concat(
        updatedPerson,
      )

      /* Update the current network with the updated people list*/
      const updatedNetwork: ICurrentNetwork = {
        ...state.currentNetwork,
        people: updatedPeople,
      }

      return {
        ...state,
        currentNetwork: updatedNetwork,
        isLoading: false,
      }
    }

    // -== UPDATE A RELATIONSHIP REASON ==- //
    case NetworkActionTypes.UPDATE_PERSON_RELATIONSHIP: {
      /* Stop if no network is selected */
      if (!state.currentNetwork) break

      /* Get each person */
      const p1Data = state.currentNetwork.people.find(
        (p) => p.id === action.p1Id,
      )
      const p2Data = state.currentNetwork.people.find(
        (p) => p.id === action.p2Id,
      )
      if (!p1Data || !p2Data) break

      /* Update each person */
      const updatedP1: IPerson = {
        ...p1Data,
        relationships: action.updatedP1Relationships,
      }
      const updatedP2: IPerson = {
        ...p2Data,
        relationships: action.updatedP2Relationships,
      }

      /* Update the current network */
      const peopleWithoutUpdated: IPerson[] = [
        ...state.currentNetwork.people,
      ].filter((p) => p.id !== action.p1Id && p.id !== action.p2Id)

      const updatedPeople = peopleWithoutUpdated
        .concat(updatedP1)
        .concat(updatedP2)

      const updatedNetwork: ICurrentNetwork = {
        ...state.currentNetwork,
        people: updatedPeople,
      }

      return {
        ...state,
        currentNetwork: updatedNetwork,
        isLoading: false,
      }
    }

    // -== UPDATE A PERSON'S NAME ==- //
    case NetworkActionTypes.UPDATE_PERSON_NAME: {
      /* Stop if no network is selected */
      if (!state.currentNetwork) break

      /* Get the person that will be updated */
      const person = state.currentNetwork.people.find(
        (p) => p.id === action.personId,
      )

      /* Stop if the person was not found */
      if (!person) break

      /* Update the person's name */
      const updatedPerson: IPerson = { ...person, name: action.updatedName }

      /* Update the people list */
      const peopleWithoutUpdated = state.currentNetwork.people.filter(
        (p) => p.id !== action.personId,
      )
      const updatedPeople = [...peopleWithoutUpdated, updatedPerson]

      const updatedNetwork: ICurrentNetwork = {
        ...state.currentNetwork,
        people: updatedPeople,
      }

      return {
        ...state,
        currentNetwork: updatedNetwork,
        isLoading: false,
      }
    }
  }

  return state
}
