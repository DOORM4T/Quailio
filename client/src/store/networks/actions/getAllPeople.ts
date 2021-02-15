import {
  networksCollection,
  peopleCollection,
  personContentCollection,
} from "../../../firebase/firebase"
import { AppThunk } from "../../store"
import {
  IGetAllPeopleAction,
  INetwork,
  IPerson,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Gets all People in a Network
 * @param networkId
 */

export const getAllPeople = (networkId: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      const peopleData: IPerson[] = await getAllPersonDataFromDB(networkId)

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
 * Gets all person data from Firestore
 * @param networkId
 */
export async function getAllPersonDataFromDB(networkId: string) {
  /* Get the Network by its ID from the Networks collection */
  const networkData: INetwork = (
    await networksCollection.doc(networkId).get()
  ).data() as INetwork

  if (!networkData) throw new Error("Network not found.")

  /* Get all Person documents related to the Person IDs in the Network */
  const getPeopleData = networkData.personIds.map(
    async (id) => (await peopleCollection.doc(id).get()).data() as IPerson,
  )
  const peopleData: IPerson[] = await Promise.all(getPeopleData)

  /* Get all person content */
  const getPeopleContentWithId = peopleData.map(async ({ id }) => {
    const contentDoc = await personContentCollection.doc(id).get()
    if (!contentDoc.exists) return null

    const { content } = contentDoc.data() as { content: string }
    const contentById = { id, content }
    return contentById
  })

  const peopleContentWithId = await Promise.all(getPeopleContentWithId)
  const peopleContentWithIdWithoutNull = peopleContentWithId.filter(
    (content) => content !== null,
  ) as {
    id: string
    content: string
  }[]

  /* For each person who has content, set their content in their peopleData object */
  peopleContentWithIdWithoutNull.forEach(({ id, content }) => {
    // Each person should be guaranteed to exist, since we got content by mapping over their IDs
    const person = peopleData.find((p) => p.id === id)!

    // Set content
    person.content = content
  })
  return peopleData
}
