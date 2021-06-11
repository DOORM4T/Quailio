import {
  networksCollection,
  peopleCollection,
} from "../../../firebase/services"
import { INetwork, IPerson } from "../networkTypes"

export async function addPersonToFirestore(
  networkId: string,
  newPerson: IPerson,
) {
  const networkDoc = await networksCollection.doc(networkId).get()
  if (!networkDoc.exists) throw new Error(`Network ${networkId} does not exist`)

  // Get the network's data
  const networkData: INetwork = networkDoc.data() as INetwork

  // Update just the personIds field of the Network document
  const updatedPersonIds = networkData.personIds.concat(newPerson.id)
  await networkDoc.ref.update({ personIds: updatedPersonIds })

  // Create a document for the new Person
  await peopleCollection.doc(newPerson.id).set(newPerson)
}
