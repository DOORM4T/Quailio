import { networks, people } from "."
import { INetwork, INetworkExport, IPerson } from "../../interfaces/network"

export async function getNetwork(sharedId: string) {
  const data = await getSharedNetworkData(sharedId)
  const relationalPeople = await getRelationalPeople(data)
  const sortedPeople = getSortedPeople(relationalPeople)

  const network: INetworkExport = {
    name: data.name || "Untitled Network",
    people: sortedPeople,
  }
  return network
}

async function getSharedNetworkData(sharedId: string) {
  const doc = await networks
    .where("sharedProperties.sharedId", "==", sharedId)
    .limit(1)
    .get()
  if (!doc || !doc.docs[0] || !doc.docs[0].exists)
    throw new Error("That network does not exist.")

  const data = doc.docs[0].data() as INetwork
  return data
}

async function getRelationalPeople(data: INetwork) {
  const getPersonPromises = data.personIds.map(idToPerson)
  const people = await Promise.all(getPersonPromises)
  return people.filter(exists) as IPerson[]
}

async function idToPerson(personId: string) {
  const doc = await people.doc(personId).get()
  if (!doc.exists) return null
  return doc.data() as IPerson
}

function exists(item: any | null) {
  if (item === null) return false
  return true
}

function getSortedPeople(peopleData: IPerson[]) {
  // Sort people by name
  // This prevents person data from "changing position," since they may be fetched out of order
  return peopleData.sort((p1, p2) => {
    return p1.name
      .toLocaleLowerCase()
      .localeCompare(p2.name.toLocaleLowerCase())
  })
}
