import { INetwork, IPerson } from "../store/networks/networkTypes"
import { networksCollection, peopleCollection } from "./firebase"

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

  /* Get all people in the network */
  const networkData = networkDoc.data() as INetwork
  const getAllPersonData = networkData.personIds.map(async (personId) => {
    /* Get the person doc */
    const personDoc = await peopleCollection.doc(personId).get()

    /* Stop if the person doc doesn't exist */
    if (!personDoc.exists) return null

    /* Get the person's data */
    const person = personDoc.data() as IPerson
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
