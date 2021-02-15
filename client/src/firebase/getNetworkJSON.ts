import { INetwork, IPerson } from "../store/networks/networkTypes"
import {
  networksCollection,
  peopleCollection,
  personContentCollection,
} from "./firebase"

//
// Export network as JSON
//
export interface INetworkJSON {
  id: string
  name: string
  people: IPerson[]
}

export async function getNetworkJSON(networkId: string) {
  /* Get the network doc */
  const networkDoc = await networksCollection.doc(networkId).get()

  /* Stop if the network doesn't exist */
  if (!networkDoc.exists) return

  /* Get all related people */
  const networkData = networkDoc.data() as INetwork
  const getAllPersonData = networkData.personIds.map(async (personId) => {
    /* Get the person doc */
    const personDoc = await peopleCollection.doc(personId).get()

    /* Stop if the person doc doesn't exist */
    if (!personDoc.exists) return null

    /* Get the person's data */
    const {
      id,
      name,
      relationships,
      thumbnailUrl,
    } = personDoc.data() as IPerson

    /* Get the person's content */
    const personContentDoc = await personContentCollection.doc(personId).get()

    const content = personContentDoc.exists
      ? (personContentDoc.data() as { content: string }).content
      : undefined

    /* Return a person-with-content object */
    const person: IPerson = {
      id,
      name,
      relationships,
      thumbnailUrl,
      content,
    }

    return person
  })

  const peopleData = await Promise.all(getAllPersonData)
  const peopleDataWithoutNull = peopleData.filter(
    (data) => data !== null,
  ) as IPerson[]

  const json: INetworkJSON = {
    id: networkData.id,
    name: networkData.name,
    people: peopleDataWithoutNull,
  }

  return json
}
