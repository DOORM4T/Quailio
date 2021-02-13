import { Reducer } from "redux"
import {
  IAddPersonAction,
  IConnectPeopleAction,
  ICreateNetworkAction,
  ICurrentNetwork,
  IDeleteNetworkByIdAction,
  IDeletePersonByIdAction,
  IDisconnectPeopleAction,
  IGetAllNetworksIdsAction,
  IGetAllPeopleAction,
  INetworksState,
  IPerson,
  ISetNetworkAction,
  ISetPersonThumbnailAction,
  IUpdatePersonNameAction,
  IUpdateRelationshipReasonAction,
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

    case NetworkActionTypes.CREATE:
      return getCreateNetworkState(state, action)

    case NetworkActionTypes.SET:
      return getSetCurrentNetworkState(state, action)

    case NetworkActionTypes.GET_ALL:
      return getAllNetworksState(state, action)

    case NetworkActionTypes.DELETE: {
      return getDeleteNetworkState(state, action)
    }

    case NetworkActionTypes.RESET_CLIENT: {
      return initialState
    }

    //
    // PEOPLE
    //

    case NetworkActionTypes.ADD_PERSON:
      return getAddPersonState(state, action)

    case NetworkActionTypes.CONNECT_PEOPLE:
    case NetworkActionTypes.DISCONNECT_PEOPLE:
      return getUpdatedConnectionState(state, action)

    case NetworkActionTypes.DELETE_PERSON:
      return getDeletePersonState(state, action)

    case NetworkActionTypes.GET_ALL_PEOPLE:
      return getAllPeopleState(state, action)

    case NetworkActionTypes.SET_PERSON_THUMBNAIL:
      return getUpdatedPersonThumbnailState(state, action)

    case NetworkActionTypes.UPDATE_PERSON_RELATIONSHIP: {
      return getUpdatedPersonRelationshipState(state, action)
    }

    case NetworkActionTypes.UPDATE_PERSON_NAME:
      return getUpdatedPersonNameState(state, action)

    default:
      return state
  }
}

function getUpdatedPersonNameState(
  state: INetworksState,
  action: IUpdatePersonNameAction,
) {
  /* Stop if no network is selected */
  if (!state.currentNetwork) return state

  /* Get the person that will be updated */

  const person = state.currentNetwork.people.find(
    (p) => p.id === action.personId,
  )

  /* Stop if the person was not found */
  if (!person) return state

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

function getUpdatedPersonRelationshipState(
  state: INetworksState,
  action: IUpdateRelationshipReasonAction,
) {
  /* Stop if no network is selected */
  if (!state.currentNetwork) return state

  /* Get each person */
  const p1Data = state.currentNetwork.people.find((p) => p.id === action.p1Id)
  const p2Data = state.currentNetwork.people.find((p) => p.id === action.p2Id)
  if (!p1Data || !p2Data) return state

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

  const updatedPeople = peopleWithoutUpdated.concat(updatedP1).concat(updatedP2)

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

function getUpdatedPersonThumbnailState(
  state: INetworksState,
  action: ISetPersonThumbnailAction,
) {
  /* Stop if there's no Network selected */
  if (!state.currentNetwork) return state

  /* Find the person whose thumbnail will be updated */
  const person = state.currentNetwork.people.find(
    (p) => p.id === action.personId,
  )
  if (!person) return state

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

function getAllPeopleState(
  state: INetworksState,
  action: IGetAllPeopleAction,
): INetworksState {
  /* Stop if there's no Network selected */
  if (!state.currentNetwork) return state

  return {
    ...state,
    currentNetwork: { ...state.currentNetwork, people: action.people },
    isLoading: false,
  }
}

/* Remove the person's ID from the current network's list of person IDs */
function getDeletePersonState(
  state: INetworksState,
  action: IDeletePersonByIdAction,
) {
  /* Stop if there is no network selected */
  if (!state.currentNetwork) return state

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

/* Get the state with/without the updated, newly connected/disconnected relationship */
function getUpdatedConnectionState(
  state: INetworksState,
  action: IConnectPeopleAction | IDisconnectPeopleAction,
) {
  /* Stop if there is no network selected */
  if (!state.currentNetwork) return state
  const peopleWithoutUpdatedPeople: IPerson[] = [
    ...state.currentNetwork.people.filter(
      (p) =>
        p.id !== action.updatedP1Data.id && p.id !== action.updatedP2Data.id,
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

function getAddPersonState(state: INetworksState, action: IAddPersonAction) {
  /* Stop if there is no network selected */
  if (!state.currentNetwork) return state

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

function getDeleteNetworkState(
  state: INetworksState,
  action: IDeleteNetworkByIdAction,
) {
  const idsWithoutDeletedNetwork = state.networks.filter(
    (network) => network.id !== action.networkId,
  )

  return {
    ...state,
    networks: idsWithoutDeletedNetwork,
    currentNetwork: null,
    isLoading: false,
  }
}

function getAllNetworksState(
  state: INetworksState,
  action: IGetAllNetworksIdsAction,
): INetworksState {
  return { ...state, networks: action.networks, isLoading: false }
}

function getSetCurrentNetworkState(
  state: INetworksState,
  action: ISetNetworkAction,
): INetworksState {
  return {
    ...state,
    currentNetwork: action.currentNetwork,
    isLoading: false,
  }
}

function getCreateNetworkState(
  state: INetworksState,
  action: ICreateNetworkAction,
): INetworksState {
  return {
    ...state,
    networks: state.networks.concat(action.newNetwork),
    currentNetwork: { ...action.newNetwork, people: [] },
    isLoading: false,
  }
}
