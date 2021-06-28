import { networks } from "."
import { INetwork } from "../../interfaces/network"

export async function getNetwork(networkId: string) {
  const doc = await networks.doc(networkId).get()
  if (!doc.exists) throw new Error("That network does not exist.")
  const data = doc.data() as INetwork
  if (!data.sharedProperties?.sharedId)
    throw new Error("You are not authorized to view this network.")
  if (data) return data
}
