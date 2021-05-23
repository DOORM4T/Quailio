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
  IImportNetworkAction,
  INetwork,
  INetworksState,
  IPerson,
  IRelationships,
  IRenameNetworkAction,
  ISetIsGroupAction,
  ISetNetworkAction,
  ISetNodeColor,
  ISetNodePinAction,
  ISetNodeScaleAction,
  ISetPersonAsBackgroundNodeAction,
  ISetPersonThumbnailAction,
  ISetRelationshipShape,
  ISharedNetworkProperties,
  IShareNetworkAction,
  IUnshareNetworkAction,
  IUpdatePersonContentAction,
  IUpdatePersonNameAction,
  IUpdateRelationshipReasonAction,
  NetworkActionTypes,
  NetworksActions,
} from "./networkTypes"

// TODO: Refactor all reducer logic to use Immer

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

    // Populate networks field with network IDs, network names, and person Ids.
    // No person data other than their ID is fetched
    case NetworkActionTypes.GET_ALL:
      return getAllNetworksState(state, action)

    case NetworkActionTypes.SET:
      return getSetCurrentNetworkState(state, action)

    case NetworkActionTypes.DELETE: {
      return getDeleteNetworkState(state, action)
    }

    case NetworkActionTypes.IMPORT_NETWORK:
      return getImportedNetworkState(state, action)

    case NetworkActionTypes.RENAME_NETWORK:
      return getRenamedNetworksState(state, action)

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

    case NetworkActionTypes.SET_PERSON_THUMBNAIL:
      return getUpdatedPersonThumbnailState(state, action)

    case NetworkActionTypes.UPDATE_PERSON_RELATIONSHIP:
      return getUpdatedPersonRelationshipState(state, action)

    case NetworkActionTypes.UPDATE_PERSON_NAME:
      return getUpdatedPersonNameState(state, action)

    case NetworkActionTypes.UPDATE_PERSON_CONTENT:
      return getUpdatedPersonContentState(state, action)

    case NetworkActionTypes.SET_RELATIONSHIP_SHAPE:
      return getSetRelationshipShapeState(state, action)

    case NetworkActionTypes.SET_IS_GROUP:
      return getSetIsGroupNodeState(state, action)

    case NetworkActionTypes.SET_NODE_COLOR:
      return getSetNodeColorState(state, action)

    // SHARING
    case NetworkActionTypes.SHARE_NETWORK:
      return getShareNetworkState(state, action)
    case NetworkActionTypes.UNSHARE_NETWORK:
      return getUnshareNetworkState(state, action)

    // OTHER
    case NetworkActionTypes.SET_NODE_PIN:
      return getPinNodeState(state, action)
    case NetworkActionTypes.SET_PERSON_NODE_SCALE:
      return getScaleNodeState(state, action)
    case NetworkActionTypes.SET_PERSON_AS_BACKGROUND_NODE:
      return getToggleNodeBackgroundState(state, action)

    default:
      return state
  }
}

function getToggleNodeBackgroundState(
  state: INetworksState,
  action: ISetPersonAsBackgroundNodeAction,
): INetworksState {
  if (state.currentNetwork?.id !== action.networkId) return state

  // 1. Find the person
  const personIndex = state.currentNetwork.people.findIndex(
    (p) => p.id === action.personId,
  )

  if (personIndex === -1) return state

  // 2. Update the person's isBackground state
  const updatedPerson = { ...state.currentNetwork.people[personIndex] }
  updatedPerson.isBackground = action.isBackground

  // 3. Update current network
  const updatedPeople = [...state.currentNetwork.people]
  updatedPeople[personIndex] = updatedPerson

  const updatedCurrentNetwork: ICurrentNetwork = {
    ...state.currentNetwork,
    people: updatedPeople,
  }

  return {
    ...state,
    currentNetwork: updatedCurrentNetwork,
    isLoading: false,
  }
}

function getScaleNodeState(
  state: INetworksState,
  action: ISetNodeScaleAction,
): INetworksState {
  if (state.currentNetwork?.id !== action.networkId) return state

  // 1. Find the person
  const personIndex = state.currentNetwork.people.findIndex(
    (p) => p.id === action.personId,
  )

  if (personIndex === -1) return state

  // 2. Update the person's scale state
  const updatedPerson = { ...state.currentNetwork.people[personIndex] }
  updatedPerson.scaleXY = action.scaleXY

  // 3. Update current network
  const updatedPeople = [...state.currentNetwork.people]
  updatedPeople[personIndex] = updatedPerson

  const updatedCurrentNetwork: ICurrentNetwork = {
    ...state.currentNetwork,
    people: updatedPeople,
  }

  return {
    ...state,
    currentNetwork: updatedCurrentNetwork,
    isLoading: false,
  }
}

function getSetRelationshipShapeState(
  state: INetworksState,
  action: ISetRelationshipShape,
): INetworksState {
  if (state.currentNetwork?.id !== action.networkId) return state

  const personIndex = state.currentNetwork.people.findIndex(
    (p) => p.id === action.personId,
  )

  if (personIndex === -1) return state

  const updatedPerson = { ...state.currentNetwork.people[personIndex] }
  const relationship = updatedPerson.relationships[action.relationshipId]
  if (!relationship) return state
  const updatedRel = { ...relationship }
  updatedRel.shape = action.shape

  updatedPerson.relationships = {
    ...updatedPerson.relationships,
    [action.relationshipId]: updatedRel,
  }

  const updatedPeople = [...state.currentNetwork.people]
  updatedPeople[personIndex] = updatedPerson

  const updatedCurrentNetwork: ICurrentNetwork = {
    ...state.currentNetwork,
    people: updatedPeople,
  }

  return { ...state, currentNetwork: updatedCurrentNetwork, isLoading: false }
}

function getPinNodeState(state: INetworksState, action: ISetNodePinAction) {
  if (state.currentNetwork?.id !== action.networkId) return state
  // Pinning a person node
  const personIndex = state.currentNetwork.people.findIndex(
    (p) => p.id === action.nodeId,
  )

  if (personIndex === -1) return state

  const updatedPerson: IPerson = {
    ...state.currentNetwork.people[personIndex],
    pinXY: action.pinXY,
  }

  const updatedPeople: IPerson[] = [...state.currentNetwork.people]
  updatedPeople[personIndex] = updatedPerson

  const updatedCurrentNetwork: ICurrentNetwork = {
    ...state.currentNetwork,
    people: updatedPeople,
  }

  return {
    ...state,
    currentNetwork: updatedCurrentNetwork,
    isLoading: false,
  }
}

function getUnshareNetworkState(
  state: INetworksState,
  action: IUnshareNetworkAction,
): INetworksState {
  // Ensure there's a current network
  if (!state.currentNetwork || state.currentNetwork.id !== action.networkId)
    return state

  // Update networks state
  const networkToUnshareIndex = state.networks.findIndex(
    (network) => network.id === action.networkId,
  )
  if (networkToUnshareIndex === -1) return state

  const networkToUnshare = state.networks[networkToUnshareIndex]
  const allowListCopy = networkToUnshare.sharedProperties?.allowList
    ? [...networkToUnshare.sharedProperties.allowList]
    : []
  const updatedSharedProperties: ISharedNetworkProperties = {
    sharedId: null,
    allowList: allowListCopy,
  }
  const updatedNetwork: INetwork = {
    ...networkToUnshare,
    sharedProperties: updatedSharedProperties,
  }

  const updatedNetworks = [...state.networks]
  updatedNetworks[networkToUnshareIndex] = updatedNetwork

  // Update the current network
  const updatedCurrentNetwork: ICurrentNetwork = {
    ...state.currentNetwork,
    sharedProperties: updatedSharedProperties,
  }

  return {
    ...state,
    networks: updatedNetworks,
    currentNetwork: updatedCurrentNetwork,
    isLoading: false,
  }
}

function getShareNetworkState(
  state: INetworksState,
  action: IShareNetworkAction,
): INetworksState {
  // Ensure there's a current network
  if (!state.currentNetwork || state.currentNetwork.id !== action.networkId)
    return state

  // Update networks state
  const networkToShareIndex = state.networks.findIndex(
    (network) => network.id === action.networkId,
  )
  if (networkToShareIndex === -1) return state

  const updatedNetwork: INetwork = {
    ...state.networks[networkToShareIndex],
    sharedProperties: action.sharedProperties,
  }

  const updatedNetworks = [...state.networks]
  updatedNetworks[networkToShareIndex] = updatedNetwork

  // Update the current network
  const updatedCurrentNetwork: ICurrentNetwork = {
    ...state.currentNetwork,
    sharedProperties: action.sharedProperties,
  }

  return {
    ...state,
    networks: updatedNetworks,
    currentNetwork: updatedCurrentNetwork,
    isLoading: false,
  }
}

function getSetNodeColorState(
  state: INetworksState,
  action: ISetNodeColor,
): INetworksState {
  // Stop if there's no current network or if the changed network isn't in view
  const currentNetwork = state.currentNetwork
  if (!currentNetwork || currentNetwork.id !== action.networkId) return state

  const personIndex = currentNetwork.people.findIndex(
    (p) => p.id === action.personId,
  )
  if (personIndex === -1) return state

  const updatedPerson: IPerson = {
    ...currentNetwork.people[personIndex],
    // Update the backgroundColor or textColor -- depends on the passed field
    [action.field]: action.newColor,
  }

  const updatedPeople: IPerson[] = [...currentNetwork.people]
  updatedPeople[personIndex] = updatedPerson

  const updatedCurrentNetwork: ICurrentNetwork = {
    ...currentNetwork,
    people: updatedPeople,
  }

  return {
    ...state,
    currentNetwork: updatedCurrentNetwork,
    isLoading: false,
  }
}

function getSetIsGroupNodeState(
  state: INetworksState,
  action: ISetIsGroupAction,
): INetworksState {
  // Ensure the current network is being updated
  if (state.currentNetwork?.id !== action.networkId) return state

  const { people } = state.currentNetwork
  const personIndex = people.findIndex((p) => p.id === action.personId)
  if (personIndex === -1) return state

  const updatedPerson: IPerson = {
    ...people[personIndex],
    isGroup: action.isGroup,
  }
  const updatedPeople: IPerson[] = [...people]
  updatedPeople[personIndex] = updatedPerson

  const updatedCurrentNetwork: ICurrentNetwork = {
    ...state.currentNetwork,
    people: updatedPeople,
  }

  return {
    ...state,
    currentNetwork: updatedCurrentNetwork,
    isLoading: false,
  }
}

function getRenamedNetworksState(
  state: INetworksState,
  action: IRenameNetworkAction,
): INetworksState {
  const network = state.networks.find((n) => n.id === action.networkId)

  /* Stop if the network doesn't exist in state */
  if (!network) return state

  /* Create the renamed network */
  const renamedNetwork: INetwork = { ...network, name: action.newName }

  /* Update networks state with the renamed network */
  const networksWithoutRenamed = state.networks.filter(
    (n) => n.id !== action.networkId,
  )
  const updatedNetworks = networksWithoutRenamed.concat(renamedNetwork)

  /* If a network is currently selected, update it (so the name change is immediately shown) */
  const updatedCurrentNetwork: ICurrentNetwork | null = state.currentNetwork
    ? {
        ...state.currentNetwork,
        name: action.newName,
      }
    : null

  /* New state */
  return {
    ...state,
    currentNetwork: updatedCurrentNetwork,
    networks: updatedNetworks,
    isLoading: false,
  }
}

/* Set the current network to the imported network  */
function getImportedNetworkState(
  state: INetworksState,
  action: IImportNetworkAction,
): INetworksState {
  const { id, name, personIds } = action.asCurrentNetwork
  const asNetworkListItem: INetwork = { id, name, personIds }
  return {
    ...state,
    networks: state.networks.concat(asNetworkListItem),
    currentNetwork: action.asCurrentNetwork,
    isLoading: false,
  }
}

function getUpdatedPersonContentState(
  state: INetworksState,
  action: IUpdatePersonContentAction,
) {
  /* Stop if no network is selected */
  if (!state.currentNetwork) return state

  /* Get the person that will be updated */
  const person = state.currentNetwork.people.find(
    (p) => p.id === action.personId,
  )

  /* Stop if the person was not found */
  if (!person) return state

  /* Update the person's content */
  const updatedPerson: IPerson = { ...person, content: action.content }

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

  /* Create the updated relationship */
  const updatedP1Relationships: IRelationships = {
    ...p1Data.relationships,
    [action.p2Id]: {
      ...p1Data.relationships[action.p2Id],
      reason: action.newReason,
    },
  }
  const updatedP2Relationships: IRelationships = {
    ...p2Data.relationships,
    [action.p1Id]: {
      ...p2Data.relationships[action.p1Id],
      reason: action.newReason,
    },
  }

  /* Update each person */
  const updatedP1: IPerson = {
    ...p1Data,
    relationships: updatedP1Relationships,
  }
  const updatedP2: IPerson = {
    ...p2Data,
    relationships: updatedP2Relationships,
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
  const peopleWithoutUpdatedPerson: IPerson[] =
    state.currentNetwork.people.filter((p) => p.id !== action.personId)
  const updatedPeople: IPerson[] =
    peopleWithoutUpdatedPerson.concat(updatedPerson)

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

/* Remove the person's ID from the current network's list of person IDs */
function getDeletePersonState(
  state: INetworksState,
  action: IDeletePersonByIdAction,
) {
  /* Stop if there is no network selected */
  const currentNetwork = state.currentNetwork
  if (!currentNetwork) return state

  /* Get the person that will be deleted */
  const personToDelete = currentNetwork.people.find(
    (p) => p.id === action.personId,
  )

  /* Stop if the person doesn't exist */
  if (!personToDelete) return state

  /* Remove all relationships with the person in the current network */
  const relationshipsCopy: IRelationships = { ...personToDelete.relationships }
  Object.keys(relationshipsCopy).forEach((otherPersonId) => {
    /* Get the other person in the relationship */
    const otherPerson = currentNetwork.people.find(
      (p) => p.id === otherPersonId,
    )
    if (!otherPerson) return

    /* Delete the relationship from the other person's relationships object */
    delete otherPerson.relationships[action.personId]
  })

  /* Remove the person from the list of IDs in the current network */
  const idsWithoutDeletedPerson = currentNetwork.personIds.filter(
    (id) => id !== action.personId,
  )

  /* Remove the person's data from the current network */
  const peopleDataWithoutDeletedPerson = currentNetwork.people.filter(
    (p) => p.id !== action.personId,
  )

  /* Network with the updated IDs */
  const updatedNetwork: ICurrentNetwork = {
    ...currentNetwork,
    personIds: idsWithoutDeletedPerson,
    people: peopleDataWithoutDeletedPerson,
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
  const peopleWithoutUpdatedPeople: IPerson[] =
    state.currentNetwork.people.filter(
      (p) =>
        p.id !== action.updatedP1Data.id && p.id !== action.updatedP2Data.id,
    )

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
    action.personData.id,
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
    currentNetwork: {
      ...action.newNetwork,
      people: [],
    },
    isLoading: false,
  }
}
