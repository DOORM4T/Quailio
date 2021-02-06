import { v4 as uuidv4 } from "uuid"
import {
  auth,
  deleteNetworkThumbnails,
  IFirebaseUser,
  networksCollection,
  peopleCollection,
  personContentCollection,
  uploadThumbnail,
  usersCollection,
} from "../../firebase"
import { AppThunk } from "../store"
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
  INetwork,
  INetworkLoadingAction,
  IPerson,
  IRelationships,
  IResetClientNetworksAction,
  ISetNetworkAction,
  ISetPersonThumbnailAction,
  IUpdateRelationshipReasonAction,
  NetworkActionTypes,
} from "./networkTypes"

// -== ACTION CREATORS ==- //
/* set isLoading state to true for async actions. Reducer will set isLoading to false for async actions.. */
export const setNetworkLoading = (
  isLoading: boolean,
): INetworkLoadingAction => ({
  type: NetworkActionTypes.LOADING,
  isLoading,
})

/**
 * Add a new Person to an existing Network
 * @param networkId ID of the network to add the person to
 * @param name new person's name
 */
export const addPerson = (networkId: string, name: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    /* Initialize the new Person's document */
    const newPerson: IPerson = {
      id: uuidv4(),
      name,
      relationships: {},
    }

    try {
      /* Database updates */
      /* Get the network document that will add this new Person */
      const networkDoc = networksCollection.doc(networkId)
      const networkData: INetwork = (await networkDoc.get()).data() as INetwork

      /* Ensure the network exists */
      if (!networkData) throw new Error("Network does not exist.")

      /* Update just the personIds field of the Network document */
      const updatedPersonIds = networkData.personIds.concat(newPerson.id)
      await networkDoc.update({ personIds: updatedPersonIds })

      /* Create a document for the new Person */
      await peopleCollection.doc(newPerson.id).set(newPerson)

      /* Update state with the new person */
      const action: IAddPersonAction = {
        type: NetworkActionTypes.ADD_PERSON,
        personId: newPerson.id,
        personData: newPerson,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to add the new Person */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

/**
 * Connect two People in some network
 * @param networkId
 * @param relationship
 */
export const connectPeople = (
  networkId: string,
  relationship: {
    p1Id: string
    p2Id: string
    p1Reason: string
    p2Reason: string
  },
): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    const { p1Id, p2Id, p1Reason = "", p2Reason = "" } = relationship

    try {
      /* Database updates */
      /* Ensure each person exists in the network */
      const network = (
        await networksCollection.doc(networkId).get()
      ).data() as INetwork
      const hasP1 = network.personIds.some((id) => id === p1Id)
      const hasP2 = network.personIds.some((id) => id === p2Id)
      if (!hasP1 || !hasP2)
        throw new Error("One or both persons do not exist in that network.")

      /* Get the Firestore documents for each Person */
      const p1Doc = peopleCollection.doc(p1Id)
      const p2Doc = peopleCollection.doc(p2Id)

      /* Get the document data for each person */
      const p1Data: IPerson = (await p1Doc.get()).data() as IPerson
      const p2Data: IPerson = (await p2Doc.get()).data() as IPerson

      /* Copy existing relationships and add the new relationship for each person */
      const updatedP1Rels: IRelationships = {
        ...p1Data.relationships,
        [p2Id]: [p1Reason, p2Reason],
      }
      const updatedP2Rels: IRelationships = {
        ...p2Data.relationships,
        [p1Id]: [p2Reason, p1Reason],
      }

      /* Update just the "relationships" field in each Person document */
      await p1Doc.update({ relationships: updatedP1Rels })
      await p2Doc.update({ relationships: updatedP2Rels })

      const updatedP1Data: IPerson = { ...p1Data, relationships: updatedP1Rels }
      const updatedP2Data: IPerson = { ...p2Data, relationships: updatedP2Rels }

      /* Update state to reflect the new connection */
      const action: IConnectPeopleAction = {
        type: NetworkActionTypes.CONNECT_PEOPLE,
        updatedP1Data,
        updatedP2Data,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to connect */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

/**
 * Disconnect two People in some network
 * @param networkId
 * @param relationship
 */
export const disconnectPeople = (
  networkId: string,
  relationship: {
    p1Id: string
    p2Id: string
  },
): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    const { p1Id, p2Id } = relationship

    try {
      /* Database updates */
      /* Ensure each person exists in the network */
      const network = (
        await networksCollection.doc(networkId).get()
      ).data() as INetwork
      const hasP1 = network.personIds.some((id) => id === p1Id)
      const hasP2 = network.personIds.some((id) => id === p2Id)
      if (!hasP1 || !hasP2)
        throw new Error("One or both persons do not exist in that network.")

      /* Get the Firestore documents for each Person */
      const p1Doc = peopleCollection.doc(p1Id)
      const p2Doc = peopleCollection.doc(p2Id)

      /* Get the document data for each person */
      const p1Data: IPerson = (await p1Doc.get()).data() as IPerson
      const p2Data: IPerson = (await p2Doc.get()).data() as IPerson

      /* Copy existing relationships */
      const updatedP1Rels: IRelationships = { ...p1Data.relationships }
      const updatedP2Rels: IRelationships = { ...p2Data.relationships }

      /* Delete the relationship with the other person */
      delete updatedP1Rels[p2Id]
      delete updatedP2Rels[p1Id]

      /* Update just the "relationships" field in each Person document */
      await p1Doc.update({ relationships: updatedP1Rels })
      await p2Doc.update({ relationships: updatedP2Rels })

      const updatedP1Data: IPerson = { ...p1Data, relationships: updatedP1Rels }
      const updatedP2Data: IPerson = { ...p2Data, relationships: updatedP2Rels }

      /* Update state to reflect the new connection */
      const action: IDisconnectPeopleAction = {
        type: NetworkActionTypes.DISCONNECT_PEOPLE,
        updatedP1Data,
        updatedP2Data,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to connect */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

/**
 * Create a new network
 * @param name
 */
export const createNetwork = (name: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    /* Initialize the Network */
    const newNetwork: INetwork = {
      id: uuidv4(),
      name,
      personIds: [],
    }

    try {
      /* Database updates */
      /* Get the authenticated User's ID */
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error("There is no currently authenticated user.")

      /* Add the Network's ID to the User's list of Network IDs */
      const userDoc = usersCollection.doc(uid)
      const doesUserDataExist = (await userDoc.get()).exists
      if (!doesUserDataExist) throw new Error("User document does not exist.")

      const userData = (await userDoc.get()).data() as IFirebaseUser
      const updatedUserNetworkIds = userData.networkIds.concat(newNetwork.id)
      userDoc.update({ networkIds: updatedUserNetworkIds })

      /* Create a document for the Network in the Networks collection */
      await networksCollection.doc(newNetwork.id).set(newNetwork)

      /* Update state with the newNetwork */
      const action: ICreateNetworkAction = {
        type: NetworkActionTypes.CREATE,
        newNetwork,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to create the Network */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

/**
 * Select a network by its ID, setting the "currentNetwork" field in global state
 * @param networkId
 */

/**
 * Gets all People in a Network
 * @param networkId
 */
export const getAllPeople = (networkId: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Get the Network by its ID from the Networks collection */
      const networkData: INetwork = (
        await networksCollection.doc(networkId).get()
      ).data() as INetwork

      if (!networkData) throw new Error("Network not found.")

      /* Get all Person documents related to the Person IDs in the Network */
      const peopleData: IPerson[] = await Promise.all(
        networkData.personIds.map(
          async (id) =>
            (await peopleCollection.doc(id).get()).data() as IPerson,
        ),
      )

      /* Update state with peopleData */
      const action: IGetAllPeopleAction = {
        type: NetworkActionTypes.GET_ALL_PEOPLE,
        people: peopleData,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to get the network */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

/**
 * Select a network by its ID, setting the "currentNetwork" field in global state
 * @param networkId
 */
export const setNetwork = (networkId: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Database updates */
      /* Get the Network by its ID from the Networks collection */
      const networkData: INetwork = (
        await networksCollection.doc(networkId).get()
      ).data() as INetwork

      if (!networkData) throw new Error("Network not found.")

      /* Get all Person documents related to the Person IDs in the Network */
      const peopleData: IPerson[] = await Promise.all(
        networkData.personIds.map(
          async (id) =>
            (await peopleCollection.doc(id).get()).data() as IPerson,
        ),
      )

      /* Create a current network object from Network and People state  */
      const currentNetwork: ICurrentNetwork = {
        ...networkData,
        people: peopleData,
      }

      /* Update state with the currentNetwork */
      const action: ISetNetworkAction = {
        type: NetworkActionTypes.SET,
        currentNetwork,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to get the network */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

/**
 * Delete a Network by its ID
 * @param networkId
 */
export const deleteNetwork = (networkId: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Database updates */
      const networkDoc = networksCollection.doc(networkId)
      const networkData = (await networkDoc.get()).data() as INetwork
      if (!networkData) throw new Error("Network does not exist.")

      /* Delete the network from User docs containing the networkId */
      const userDocs = await usersCollection
        .where("networkIds", "array-contains", networkId)
        .get()
      userDocs.docs.forEach((doc) => {
        const data = doc.data() as IFirebaseUser
        const updatedNetworkIds = data.networkIds.filter(
          (id) => id !== networkId,
        )
        doc.ref.update({ networkIds: updatedNetworkIds })
      })

      /* Delete all People in the Network */
      const deletePeopleList = networkData.personIds.map(async (personId) => {
        try {
          await dispatch<any>(deletePerson(networkId, personId))
        } catch (error) {
          console.error(error)
        }
      })
      await Promise.all(deletePeopleList)

      /* Delete the Network */
      await networkDoc.delete()

      /* Delete all images used by the network */
      try {
        await deleteNetworkThumbnails(networkId)
      } catch (error) {
        /* Continue execution even if thumbnail deletion fails. An error here indicates the network had no uploaded thumbnails. */
        console.error(error)
      }

      /* Update state accordingly with networkId */
      const action: IDeleteNetworkByIdAction = {
        type: NetworkActionTypes.DELETE,
        networkId,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to delete the Network */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

/**
 * Delete a Person from a Network by ID
 * @param networkId
 * @param personId
 */
export const deletePerson = (networkId: string, personId: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Remove the Person from the Network */
      const networkDoc = networksCollection.doc(networkId)
      const networkData = (await networkDoc.get()).data() as INetwork
      const peopleWithoutDeletedPerson = networkData.personIds.filter(
        (id) => id !== personId,
      )

      /* Update the Network's personIds field with the new list of person IDs */
      await networkDoc.update({ personIds: peopleWithoutDeletedPerson })

      /* Get the Person's document*/
      const personDoc = peopleCollection.doc(personId)
      const personData = (await (await personDoc.get()).data()) as IPerson

      /* Remove all relationships including the deleted Person */
      const relationshipUpdates: Promise<void>[] = Object.keys(
        personData.relationships,
      ).map(async (relationshipId) => {
        const otherPersonDoc = peopleCollection.doc(relationshipId)
        const otherPersonData = (await otherPersonDoc.get()).data() as IPerson
        const updatedRelationship: IRelationships = {
          ...otherPersonData.relationships,
        }
        delete updatedRelationship[personId]
        return otherPersonDoc.update({ relationships: updatedRelationship })
      })

      await Promise.all(relationshipUpdates)

      /* Remove the Person's content document */
      const contentDoc = personContentCollection.doc(personId)
      const hasContentDoc = (await contentDoc.get()).exists
      if (hasContentDoc) {
        await contentDoc.delete()
      }

      /* Delete the Person's document */
      await personDoc.delete()

      /* Update state accordingly with networkId and personId */
      const action: IDeletePersonByIdAction = {
        type: NetworkActionTypes.DELETE_PERSON,
        networkId,
        personId,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to delete the Person */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

/**
 * Get all Networks belonging to the currently authenticated user
 */
export const getAllNetworks = (): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Check for an authenticated User */
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error("There is no currently authenticated user.")

      /* Get the IDs of the User's Networks   */
      const userData: IFirebaseUser = (
        await usersCollection.doc(uid).get()
      ).data() as IFirebaseUser

      if (!userData) throw new Error("User data not found.")

      /* Get the Networks corresponding to the IDs */
      const networkData: INetwork[] = await Promise.all(
        userData.networkIds.map(
          async (id) =>
            (await networksCollection.doc(id).get()).data() as INetwork,
        ),
      )

      /* Ensure Network data exists for each Network */
      const existingNetworkData = networkData.filter((data) => Boolean(data))

      /* Update state accordingly with networks data */
      const action: IGetAllNetworksIdsAction = {
        type: NetworkActionTypes.GET_ALL,
        networks: existingNetworkData,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to get list of network IDs */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

/**
 * Set a person's thumbnail
 * @param personId
 * @param thumbnailUrl
 */
export const setPersonThumbnail = (
  networkId: string,
  personId: string,
  thumbnailFile: File,
): AppThunk => async (dispatch) => {
  dispatch(setNetworkLoading(true))

  try {
    const personDoc = peopleCollection.doc(personId)

    /* Ensure the Person exists */
    const doesExist = (await personDoc.get()).exists
    if (!doesExist) throw new Error("That person does not exist.")

    /* Upload the thumbnail file */
    const thumbnailUrl = await uploadThumbnail(networkId, thumbnailFile)
    if (thumbnailUrl === null)
      throw new Error("Failed to upload the thumbnail.")

    /* Set the Person's thumbnail url field */
    await personDoc.set({ thumbnailUrl }, { merge: true }) // set + merge in case the field is undefined

    /* Update state accordingly with personId and thumbnailUrl */
    const action: ISetPersonThumbnailAction = {
      type: NetworkActionTypes.SET_PERSON_THUMBNAIL,
      personId,
      thumbnailUrl,
    }

    return dispatch(action)
  } catch (error) {
    /* Failed to set the Person's thumbnail url*/
    dispatch(setNetworkLoading(false))
    throw error
  }
}

/**
 * Update a person's relationship reason from the person 1's point of view
 * @param p1Id ID of person 1
 * @param p2Id ID of person 2
 * @param p2MeaningToP1 what person 2 means to person 1
 */
export const updateRelationshipReason = (
  p1Id: string,
  p2Id: string,
  p2MeaningToP1: string,
): AppThunk => async (dispatch) => {
  dispatch(setNetworkLoading(true))

  try {
    const p1Doc = await peopleCollection.doc(p1Id).get()
    const p2Doc = await peopleCollection.doc(p2Id).get()

    /* Ensure each person exists */
    if (!p1Doc.exists) throw new Error("Person 1 does not exist.")
    if (!p2Doc.exists) throw new Error("Person 2 does not exist.")

    /* Get person data */
    const p1Data = p1Doc.data() as IPerson
    const p2Data = p2Doc.data() as IPerson

    /* Update the relationship */
    const p1MeaningToP2 = p1Data.relationships[p2Id][0]
    const updatedP1Relationships: IRelationships = {
      ...p1Data.relationships,
      [p2Id]: [p1MeaningToP2, p2MeaningToP1],
    }
    const updatedP2Relationships: IRelationships = {
      ...p2Data.relationships,
      [p1Id]: [p2MeaningToP1, p1MeaningToP2],
    }

    p1Doc.ref.update({ relationships: updatedP1Relationships })
    p2Doc.ref.update({ relationships: updatedP2Relationships })

    /* Update state accordingly with personId and thumbnailUrl */
    const action: IUpdateRelationshipReasonAction = {
      type: NetworkActionTypes.UPDATE_PERSON_RELATIONSHIP,
      updatedP1Relationships,
      updatedP2Relationships,
      p1Id,
      p2Id,
    }

    return dispatch(action)
  } catch (error) {
    /* Failed to change the relationship reason*/
    dispatch(setNetworkLoading(false))
    throw error
  }
}

/**
 * Reset local network state. Called when the logout/delete account actions are successful.
 */
export const resetLocalNetworks = (): IResetClientNetworksAction => ({
  type: NetworkActionTypes.RESET_CLIENT,
})
